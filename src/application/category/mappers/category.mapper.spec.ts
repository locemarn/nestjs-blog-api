import { beforeEach, describe, expect, it } from 'vitest';
import { CategoryMapper } from './category.mapper';
import {
  Category,
  CategoryProps,
} from 'src/domain/category/entities/category.entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { CategoryOutputDto } from '../queries/get-category-by-id/get-category-by-id.dto';

describe('CategoryMapper', () => {
  let mapper: CategoryMapper;
  let categoryEntity: Category;
  const categoryId = Identifier.create(1);
  const categoryName = 'Testing';

  beforeEach(() => {
    mapper = new CategoryMapper();
    const props: CategoryProps = { name: CategoryName.create(categoryName) };
    categoryEntity = Category.create(props, categoryId);
  });

  it('should map Category entity to CategoryOutputDto', () => {
    const expceptToDto: CategoryOutputDto = { id: 1, name: categoryName };
    const actualDto = mapper.toDto(categoryEntity);
    expect(actualDto).toEqual(expceptToDto);
  });

  it('should handle null entity in toDto', () => {
    expect(mapper.toDto(null)).toBeNull();
  });

  it('should map array of entities in toDtos', () => {
    const dtos = mapper.toDtos([categoryEntity]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0]).toEqual({ id: 1, name: categoryName });
  });

  it('should handle null or empty array in toDtos', () => {
    expect(mapper.toDtos(null)).toEqual([]);
    expect(mapper.toDtos([])).toEqual([]);
  });
});
