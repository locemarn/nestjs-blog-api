import { Injectable } from '@nestjs/common';
import { PostOutputDto } from '../queries/get-post-by-id/get-post-by-id.dto';
import { Post } from '../../../domain/post/entities/post.entity';

@Injectable()
export class PostMapper {
  toDto(entity: Post | null): PostOutputDto | null {
    if (!entity) return null;
    const dto = new PostOutputDto();
    dto['id'] = entity.id.Value as number;
    dto['title'] = entity.title.Value;
    dto['content'] = entity.content.Value;
    dto['published'] = entity.isPublished;
    dto['authorId'] = entity.authorId.Value as number;
    dto['categoryIds'] = entity.categoryIds.map((id) => id.Value as number);
    dto['created_at'] = entity.created_at;
    dto['updated_at'] = entity.updated_at;

    return dto;
  }

  toDtos(entities: Post[]): PostOutputDto[] {
    if (!entities) return [];
    return entities
      .map((entity) => this.toDto(entity))
      .filter((dto) => dto !== null);
  }
}
