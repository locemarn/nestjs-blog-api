import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Post as PrismaPost } from '@prisma/client';
import { Post, PostProps } from 'src/domain/post/entities/post.entity';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { FindPostQuery } from 'src/domain/post/repositories/post.repository.interface';

@Injectable()
export class PrismaPostRepository {
  private readonly logger = new Logger(PrismaPostRepository.name);

  constructor(private readonly _prisma: PrismaService) {}

  // --- Mappers ---
  private mapToDomain(
    prismaPost: (PrismaPost & { categories: { id: number }[] }) | null,
  ): Post | null {
    if (!prismaPost) {
      return null;
    }

    const postProps: PostProps = {
      title: PostTitleVo.create(prismaPost.title),
      content: PostContentVo.create(prismaPost.content),
      published: prismaPost.published,
      userId: Identifier.create(prismaPost.userId as number),
      categoryIds: prismaPost.categories.map(
        (category) => Identifier.create(category.id) ?? [],
      ),
      created_at: prismaPost.created_at,
      updated_at: prismaPost.updated_at,
    };

    const identifier = Identifier.create(prismaPost.id);

    return Post.create(postProps, identifier);
  }

  // Maps domain Post basic fields to Prisma data format (excludes relations)
  private mapBasePersistenceData(
    post: Post,
  ): Omit<Prisma.PostUncheckedCreateInput, 'id' | 'created_at' | 'updated_at'> {
    return {
      title: post.title.Value,
      content: post.content.Value,
      published: post.isPublished,
      userId: post.authorId?.Value as number | undefined,
    };
  }

  // Helper to map category IDs for Prisma connect/set operations
  private mapCategoryIdsForConnect(
    categoryIds: Identifier[],
  ): Prisma.CategoryWhereUniqueInput[] {
    // Prisma connect/set expects an array of objects like { id: number }
    return categoryIds.map((id) => ({ id: id.Value as number }));
  }

  // --- Repository Methods ---

  async save(post: Post): Promise<Post> {
    // const basePersistenceData = this.mapBasePersistenceData(post);
    const postIdValue = post.id?.Value;
    const isUpdate = postIdValue !== undefined && postIdValue !== 0;
    const categoryConnectData = this.mapCategoryIdsForConnect(post.categoryIds);

    const baseData = {
      title: post.title.Value,
      content: post.content.Value,
      published: post.isPublished,
      userId: post.authorId?.Value as number,
    };

    if (baseData.userId === undefined || baseData.userId === null) {
      this.logger.error(
        `Attempted to save post without a valid userId. Post ID (if exists): ${postIdValue}`,
      );
      throw new Error('Cannot save post without a valid author ID.');
    }

    let savedOrUpdatedPrismaPost: PrismaPost;
    try {
      if (isUpdate) {
        // --- UPDATE ---
        this.logger.debug(`Updating post with ID: ${postIdValue}`);
        const idForWhere = postIdValue as number;

        savedOrUpdatedPrismaPost = await this._prisma.$transaction(
          async (tx) => {
            const updatedPost = await tx.post.update({
              where: { id: idForWhere },
              data: {
                ...baseData,
                updated_at: new Date(),
              },
            });
            await tx.post.update({
              where: { id: idForWhere },
              data: {
                categories: {
                  set: categoryConnectData,
                },
              },
              include: { categories: { select: { id: true } } },
            });

            return updatedPost;
          },
        );
      } else {
        // --- CREATE ---
        this.logger.debug(`Creating new post with title: ${post.title.Value}`);
        savedOrUpdatedPrismaPost = await this._prisma.post.create({
          data: {
            ...baseData,
            categories:
              categoryConnectData.length > 0
                ? {
                    connect: categoryConnectData,
                  }
                : undefined,
          },
        });
        this.logger.debug(
          `Post created with ID: ${savedOrUpdatedPrismaPost.id}`,
        );
      }

      // Fetch the final state WITH relations to ensure correct mapping
      const finalPrismaPost = await this._prisma.post.findUnique({
        where: { id: savedOrUpdatedPrismaPost.id },
        include: { categories: { select: { id: true } } },
      });

      if (!finalPrismaPost) {
        this.logger.error(
          `Could not retrieve post ID ${savedOrUpdatedPrismaPost.id} after save operation.`,
        );
        throw new Error('Could not retrieve saved post after save operation.');
      }

      const domainPost = this.mapToDomain(finalPrismaPost);
      if (!domainPost) {
        this.logger.error(
          `Could not map final saved post (ID: ${finalPrismaPost.id}) back to domain entity.`,
        );
        throw new Error(
          'Could not map final saved post back to domain entity.',
        );
      }
      return domainPost;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error saving post (ID: ${postIdValue ?? 'NEW'}): ${err.message}`,
        err.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            `Database unique constraint failed: ${(error.meta as { target: string[] })?.target?.join(', ')}`,
          );
        }
        if (error.code === 'P2025') {
          throw new PostNotFoundException(`ID: ${postIdValue} for update`);
        }
        if (error.code === 'P2003') {
          throw new Error(
            `Invalid reference provided: ${(error.meta as { target: string[] })?.target?.join(', ')}`,
          );
        }
      }
      throw error;
    }
  }

  async findById(id: number): Promise<Post | null> {
    this.logger.debug(`Finding post by ID: ${id}`);
    try {
      const prismaPost = await this._prisma.post.findUnique({
        where: { id },
        include: { categories: { select: { id: true } } },
      });
      return this.mapToDomain(prismaPost);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error finding post by ID ${id}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  // Helper to build the common 'where' clause for find/count
  private buildWhereClause(query?: FindPostQuery): Prisma.PostWhereInput {
    const whereClause: Prisma.PostWhereInput = {};
    if (query?.published !== undefined) {
      whereClause.published = query.published;
    }
    if (query?.authorId) {
      whereClause.userId = query.authorId.Value as number; // Ensure ID is number
    }
    if (query?.categoryId) {
      // Find posts that have *at least* this category
      whereClause.categories = {
        some: { id: query.categoryId.Value as number },
      };
    }
    // Add other filter conditions here (e.g., search term)
    return whereClause;
  }

  async find(query?: FindPostQuery): Promise<Post[]> {
    const whereClause = this.buildWhereClause(query);
    const skip = query?.skip ?? 0;
    const take = query?.take ?? 10;

    this.logger.debug(
      `Finding posts with query: ${JSON.stringify(query)}, skip: ${skip}, take: ${take}`,
    );

    try {
      const prismaPosts = await this._prisma.post.findMany({
        where: whereClause,
        skip,
        take,
        include: { categories: { select: { id: true } } },
        orderBy: { created_at: 'desc' },
      });
      // Map results
      return prismaPosts
        .map((p) => this.mapToDomain(p))
        .filter((p) => p !== null);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error finding posts: ${err.message}`, err.stack);
      throw error;
    }
  }

  // Implement the count method needed for pagination
  async count(query?: FindPostQuery): Promise<number> {
    const whereClause = this.buildWhereClause(query);
    this.logger.debug(`Counting posts with query: ${JSON.stringify(query)}`);
    try {
      const count = await this._prisma.post.count({
        where: whereClause,
      });
      return count;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error counting posts: ${err.message}`, err.stack);
      throw error;
    }
  }

  // These can likely just reuse find with appropriate query object
  async findPublishedPosts(skip?: number, take?: number): Promise<Post[]> {
    return this.find({ published: true, skip, take });
  }

  async findByAuthorId(
    authorId: Identifier,
    publishedOnly: boolean = false,
  ): Promise<Post[]> {
    const query: FindPostQuery = { authorId };
    if (publishedOnly) {
      query.published = true;
    }
    return this.find(query);
  }

  async delete(id: number): Promise<boolean> {
    this.logger.debug(`Attempting to delete post with ID: ${id}`);
    try {
      console.log('id --->', id);
      const idForWhere = id;
      await this._prisma.post.delete({
        where: { id: idForWhere },
      });
      this.logger.log(`Successfully deleted post with ID: ${id}`);
      return true;
    } catch (error) {
      const err = error as Error;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        this.logger.warn(`Post with ID ${id} not found for deletion.`);
        return false;
      }
      this.logger.error(
        `Error deleting post with ID ${id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
