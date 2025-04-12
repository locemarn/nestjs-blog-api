import { Identifier } from 'src/domain/shared/identifier';
import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(id: Identifier): Promise<boolean>;
  getById(id: Identifier): Promise<Category>;
  getCategories(limit: number, offset: number): Promise<Category[]>;
}
