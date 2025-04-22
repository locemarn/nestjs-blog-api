/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  CATEGORY_MAPPER_TOKEN,
  CategoryMapper,
} from './mappers/category.mapper';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { CreateCategoryCommandHandler } from './commands/create-category/create-category.handler';
import { GetAllCategoriesQueryHandler } from './queries/get-all-categories/get-all-categories.handler';
import { GetCategoryByIdQueryHandler } from './queries/get-category-by-id/get-category-by-id.handler';

export const CategoryCommandHandlers: Provider[] = [
  CreateCategoryCommandHandler /* Update, Delete */,
];

export const CategoryQueryHandlers: Provider[] = [
  GetAllCategoriesQueryHandler,
  GetCategoryByIdQueryHandler,
];

export const CategoryEventHandlers: Provider[] = [
  /* ... */
];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [
    CategoryMapper,
    { provide: CATEGORY_MAPPER_TOKEN, useExisting: CategoryMapper },
    ...CategoryCommandHandlers,
    ...CategoryQueryHandlers,
    ...CategoryEventHandlers,
  ],
  exports: [CategoryMapper],
})
export class CategoryAppModule {}
