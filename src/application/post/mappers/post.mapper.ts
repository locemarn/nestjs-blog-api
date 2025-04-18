import { Injectable } from '@nestjs/common';
import { PostOutputDto } from '../queries/get-post-by-id/get-post-by-id.dto';
import { Post } from '../../../domain/post/entities/post.entity';

export const POST_MAPPER_TOKEN = Symbol('PostMapper');

@Injectable()
export class PostMapper {
  toDto(entity: Post | null): PostOutputDto | null {
    if (!entity) return null;
    const dto: PostOutputDto = {
      id: entity.id.Value as number,
      title: entity.title.Value,
      content: entity.content.Value,
      published: entity.isPublished,
      authorId: entity.authorId.Value as number,
      categoryIds: entity.categoryIds.map((id) => id.Value as number),
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
    return dto;
  }

  toDtos(entities: Post[]): PostOutputDto[] {
    if (!entities) return [];
    return entities
      .map((entity) => this.toDto(entity))
      .filter((dto) => dto !== null);
  }
}
