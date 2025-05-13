import { Prisma } from '@prisma/client';
import { CommentResponse } from 'src/domain/comment/entities/comment-response.entity';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ICommentRepository } from 'src/domain/comment/repositories/comment.repository.interface';

// --- Helper: Prisma Types with Relations ---
const commentWithResponses = Prisma.validator<Prisma.CommentDefaultArgs>()({
  include: {
    response: true, // Relation name from your schema
  },
});
type PrismaCommentWithResponses = Prisma.CommentGetPayload<
  typeof commentWithResponses
>;

const responseWithRelations =
  Prisma.validator<Prisma.CommentResponseDefaultArgs>()({
    include: { user: true }, // Add if needed for mapping
  });
type PrismaResponseWithRelations = Prisma.CommentResponseGetPayload<
  typeof responseWithRelations
>;

// --- Helper: Mapping Functions (Strongly recommend a dedicated Mapper class) ---

function mapPrismaResponseToDomain(
  prismaResponse: PrismaResponseWithRelations,
): CommentResponse | null {
  if (!prismaResponse) return null;
  // Make sure CommentResponse.create exists and accepts these props
  try {
    return CommentResponse.create(
      {
        content: CommentContent.create(prismaResponse.content),
        userId: Identifier.create(prismaResponse.userId),
        commentId: Identifier.create(prismaResponse.commentId),
        postId: Identifier.create(prismaResponse.commentId),
        created_at: prismaResponse.created_at,
        updated_at: prismaResponse.updated_at,
      },
      Identifier.create(prismaResponse.id),
    );
  } catch (error) {
    console.error(
      'Error mapping Prisma CommentResponse to Domain:',
      prismaResponse,
      error,
    );
    return null;
  }
}

function mapPrismaToDomain(
  prismaComment: PrismaCommentWithResponses,
): Comment | null {
  if (!prismaComment) return null;

  const domainResponses =
    prismaComment.response
      ?.map(mapPrismaResponseToDomain)
      .filter((r): r is CommentResponse => r !== null) ?? []; // Filter out nulls from failed mapping // Default to empty array

  try {
    // Make sure Comment.create exists and accepts these props
    return Comment.create(
      {
        content: CommentContent.create(prismaComment.content),
        postId: Identifier.create(prismaComment.postId),
        userId: Identifier.create(prismaComment.userId),
        responses: domainResponses,
        created_at: prismaComment.created_at,
        updated_at: prismaComment.updated_at,
      },
      Identifier.create(prismaComment.id),
    );
  } catch (error) {
    console.error(
      'Error mapping Prisma Comment to Domain:',
      prismaComment,
      error,
    );
    return null; // Handle mapping errors gracefully
  }
}

function mapDomainToPrismaCreate(comment: Comment): Prisma.CommentCreateInput {
  return {
    content: comment.content.Value,
    // Connect relations using schema field names
    post: { connect: { id: comment.postId.Value } },
    user: { connect: { id: comment.authorId.Value } },
    // NOTE: Do not map 'response' here; replies are created separately.
  };
}

function mapDomainToPrismaUpdate(comment: Comment): Prisma.CommentUpdateInput {
  // Only include fields meant to be updated
  const data: Prisma.CommentUpdateInput = {
    content: comment.content.Value,
    // updated_at is handled by Prisma @updated_at directive usually
  };
  // IMPORTANT: Do not include postId or userId here unless you intend to allow changing them.
  return data;
}

@Injectable()
export class PrismaCommentRepository implements ICommentRepository {
  // Use consistent naming (prisma instead of _prisma)
  constructor(private readonly prisma: PrismaService) {}

  // --- Implement findById ---
  /**
   * Finds a single comment by its unique identifier.
   * Includes associated responses based on the schema relation.
   * @param id The Identifier of the comment to find.
   * @returns A promise resolving to the Comment domain entity or null if not found.
   */
  async findById(id: Identifier): Promise<Comment | null> {
    try {
      const prismaComment = await this.prisma.comment.findUnique({
        where: { id: id.Value },
        ...commentWithResponses,
      });

      if (!prismaComment) return null;
      return mapPrismaToDomain(prismaComment);
    } catch (error) {
      console.error(`Error fetching comment by ID ${id.Value}:`, error);
      throw new Error(`Database error while fetching comment ${id.Value}.`);
    }
  }

  // --- Implement save (for creating new comments) ---
  /**
   * Persists a new comment entity to the database.
   * @param comment The Comment domain entity to save.
   * @returns A promise resolving to the saved Comment domain entity (with DB-generated ID/timestamps).
   */
  async saveComment(comment: Comment): Promise<Comment> {
    const created_ata = mapDomainToPrismaCreate(comment);
    try {
      const savedPrismaComment = await this.prisma.comment.create({
        data: created_ata,
        ...commentWithResponses, // Include relations in the returned data
      });
      const savedDomainComment = mapPrismaToDomain(savedPrismaComment);
      if (!savedDomainComment) {
        // This indicates a mapping error after a successful save
        throw new Error(
          'Failed to map newly saved comment back to domain entity.',
        );
      }
      return savedDomainComment;
    } catch (error) {
      console.error('Error saving new comment:', error);
      // Consider throwing specific infrastructure exceptions based on Prisma errors
      throw new Error('Database error while saving comment.');
    }
  }

  // --- Implement update ---
  /**
   * Updates an existing comment entity in the database.
   * @param comment The Comment domain entity with updated data.
   * @returns A promise resolving to the updated Comment domain entity.
   * @throws NotFoundException if the comment to update does not exist.
   */
  async update(comment: Comment): Promise<Comment> {
    const updated_ata = mapDomainToPrismaUpdate(comment);
    try {
      const updatedPrismaComment = await this.prisma.comment.update({
        where: { id: comment.id.Value },
        data: updated_ata,
        ...commentWithResponses, // Include relations in the returned data
      });
      const updatedDomainComment = mapPrismaToDomain(updatedPrismaComment);
      if (!updatedDomainComment) {
        // This indicates a mapping error after a successful update
        throw new Error('Failed to map updated comment back to domain entity.');
      }
      return updatedDomainComment;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Throw NotFoundException if Prisma indicates the record wasn't found
        throw new NotFoundException(
          `Comment with ID ${comment.id.Value} not found for update.`,
        );
      }
      console.error(
        `Error updating comment with ID ${comment.id.Value}:`,
        error,
      );
      // Consider throwing specific infrastructure exceptions
      throw new Error(
        `Database error while updating comment ${comment.id.Value}.`,
      );
    }
  }

  // --- Delete (already implemented, slight refinement) ---
  /**
   * Deletes a comment record from the database using its ID.
   * Handles cases where the comment might already be deleted (Prisma error P2025).
   * @param id The Identifier of the comment to delete.
   */
  async delete(id: Identifier): Promise<void> {
    try {
      await this.prisma.comment.delete({
        where: { id: id.Value },
      });
    } catch (err) {
      // Use different variable name for clarity
      const error = err as Error; // Type assertion
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Record not found - treat as success (idempotent) or throw NotFoundException
        console.warn(
          `Attempted to delete non-existent comment with ID ${id.Value}. Assuming success.`,
        );
        return; // Or: throw new NotFoundException(`Comment with ID ${id.Value} not found for deletion.`);
      }
      // Log and re-throw other errors
      console.error(`Error deleting comment with ID ${id.Value}:`, error);
      throw new Error(`Database error while deleting comment ${id.Value}.`);
    }
  }

  // --- Optional: findByPostId Implementation (if needed and added to interface) ---
  async findByPostId(
    postId: Identifier,
    limit: number,
    offset: number,
  ): Promise<Comment[]> {
    try {
      const prismaComments = await this.prisma.comment.findMany({
        where: { postId: postId.Value },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'asc' }, // Example order
        ...commentWithResponses, // Include responses
      });
      // Map and filter out potential nulls from mapping errors
      return prismaComments
        .map(mapPrismaToDomain)
        .filter((c): c is Comment => c !== null);
    } catch (error) {
      console.error(
        `Error fetching comments for post ID ${postId.Value}:`,
        error,
      );
      throw new Error(
        `Database error while fetching comments for post ${postId.Value}.`,
      );
    }
  }
}
