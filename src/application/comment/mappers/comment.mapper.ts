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
    if (!entity) {
      return null;
    }
    return {
      id: entity.id.Value,
      content: entity.content.Value,
      postId: entity.postId.Value,
      authorId: entity.userId.Value,
      commentId: entity.commentId.Value,
      created_at: entity._props.created_at as Date,
      updated_at: entity._props.updated_at as Date,
      // replies: entity._props.replies?.map((reply) => this.toDto(reply)) ?? [],
    };
  }

  toDto(entity: Comment | null): CommentOutputDto | null {
    if (!entity) {
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
      created_at: entity._props.created_at as Date,
      updated_at: entity._props.updated_at as Date,
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
