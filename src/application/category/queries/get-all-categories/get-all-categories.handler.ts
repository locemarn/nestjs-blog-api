import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllCategoriesQuery } from './get-all-categories.query';
import { GetAllCategoriesOutputDto } from './get-all-categories.dto';
import { Inject } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import {
  CATEGORY_MAPPER_TOKEN,
  CategoryMapper,
} from '../../mappers/category.mapper';

@QueryHandler(GetAllCategoriesQuery)
export class GetAllCategoriesQueryHandler
  implements IQueryHandler<GetAllCategoriesQuery, GetAllCategoriesOutputDto>
{
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(CATEGORY_MAPPER_TOKEN)
    private readonly categoryMapper: CategoryMapper,
  ) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    query: GetAllCategoriesQuery,
  ): Promise<GetAllCategoriesOutputDto> {
    const categories = await this.categoryRepository.findAll();
    return this.categoryMapper.toDtos(categories);
  }
}
