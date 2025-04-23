import { Injectable } from '@nestjs/common';
import { Category } from 'src/domain/category/entities/category.entity';
import { CategoryOutputDto } from '../queries/get-category-by-id/get-category-by-id.dto';

// --- Define Token ---
export const CATEGORY_MAPPER_TOKEN = Symbol('CategoryMapper');

@Injectable()
export class CategoryMapper {
  toDto(entity: Category | null): CategoryOutputDto | null {
    if (!entity) return null;
    return {
      id: entity.id.Value as number,
      name: entity.name.Value,
    };
  }

  toDtos(entities: Category[] | null): CategoryOutputDto[] {
    if (!entities) return [];
    return entities.map((e) => this.toDto(e)).filter((dto) => dto !== null);
  }
}
