import { Injectable } from '@nestjs/common';
import { CommentResponseOutputDto } from '../queries/dto/comment-response.output.dto';
import { CommentOutputDto } from '../queries/dto/comment.output.dto';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { CommentResponse } from 'src/domain/comment/entities/comment-response.entity';

export const COMMENT_MAPPER_TOKEN = Symbol('CommentMapper');

@Injectable()
export class CommentMapper {
  toResponseDto(
    entity: CommentResponse | null,
  ): CommentResponseOutputDto | null {
    if (!entity) return null;

    if (
      !entity.id ||
      !entity.content ||
      !entity.userId ||
      !entity.commentId ||
      !entity.created_at ||
      !entity.updated_at
    ) {
      console.error(
        'CommentMapper.toResponseDto: Incomplete CommentResponse entity provided.',
      );
      return null;
    }

    return {
      id: entity.id.Value,
      content: entity.content.Value,
      authorId: entity.userId.Value,
      commentId: entity.commentId.Value,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  toDto(entity: Comment | null): CommentOutputDto | null {
    if (!entity) return null;
    if (
      !entity.id ||
      !entity.content ||
      !entity.authorId ||
      !entity.postId ||
      !entity.created_at ||
      !entity.updated_at
    ) {
      // MAKE SURE THIS LOG IS ACTIVE AND STRINGIFIES THE ENTITY
      console.error(
        'CommentMapper.toDto: Incomplete Comment entity provided. Entity details:',
        JSON.stringify(entity, null, 2),
      );
      return null;
    }

    const replyDtos = entity.responses
      ? entity.responses
          .map((reply) =>
            this.toResponseDto(reply as unknown as CommentResponse),
          )
          .filter((dto) => dto !== null)
      : [];

    return {
      id: entity.id.Value,
      content: entity.content.Value,
      authorId: entity.authorId.Value,
      postId: entity.postId.Value,
      replies: replyDtos,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  // Maps an array of Comment entities to an array of Comment DTOs
  toDtos(entities: Comment[] | null): CommentOutputDto[] {
    if (!entities) {
      return [];
    }
    return entities
      .map((entity) => this.toDto(entity))
      .filter((dto) => dto !== null);
  }
}
