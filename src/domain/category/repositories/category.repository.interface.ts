import { Identifier } from 'src/domain/shared/identifier';
import { Category } from '../entities/category.entity';
import { CategoryName } from '../value-objects/category-name.vo';

export interface ICategoryRepository {
  save(category: Category): Promise<Category>;
  findById(id: Identifier): Promise<Category | null>;
  findByName(name: CategoryName): Promise<Category | null>;
  findManyByIds(ids: Identifier[]): Promise<Category[]>;
  findAll(): Promise<Category[]>;
  delete(id: Identifier): Promise<boolean>;
}

export const CATEGORY_REPOSITORY_TOKEN = Symbol('ICategoryRepository');
