import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  CATEGORY_MAPPER_TOKEN,
  CategoryMapper,
} from './mappers/category.mapper';
import { CreateCategoryCommandHandler } from './commands/create-category/create-category.handler';
import { GetAllCategoriesQueryHandler } from './queries/get-all-categories/get-all-categories.handler';
import { GetCategoryByIdQueryHandler } from './queries/get-category-by-id/get-category-by-id.handler';
import { UpdateCategoryCommandHandler } from './commands/update-category/update-category.handler';
import { DeleteCategoryCommandHandler } from './commands/delete-category/delete-category.handler';

export const CategoryCommandHandlers: Provider[] = [
  CreateCategoryCommandHandler,
  UpdateCategoryCommandHandler,
  DeleteCategoryCommandHandler,
];

export const CategoryQueryHandlers: Provider[] = [
  GetAllCategoriesQueryHandler,
  GetCategoryByIdQueryHandler,
];

export const CategoryEventHandlers: Provider[] = [
  /* ... */
];

@Module({
  imports: [CqrsModule],
  providers: [
    CategoryMapper,
    { provide: CATEGORY_MAPPER_TOKEN, useExisting: CategoryMapper },
    ...CategoryCommandHandlers,
    ...CategoryQueryHandlers,
    ...CategoryEventHandlers,
  ],
  exports: [],
})
export class CategoryAppModule {}
