import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import {
  CATEGORY_MAPPER_TOKEN,
  CategoryMapper,
} from '../../mappers/category.mapper';
import { CategoryOutputDto } from './get-category-by-id.dto';
import { GetCategoryByIdQuery } from './get-category-by-id.query';

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdQueryHandler
  implements IQueryHandler<GetCategoryByIdQuery, CategoryOutputDto | null>
{
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(CATEGORY_MAPPER_TOKEN)
    private readonly categoryMapper: CategoryMapper,
  ) {}

  /**
   * Executes the GetCategoryByIdQuery.
   * @param query The query object containing the category ID.
   * @returns The CategoryOutputDto if found.
   * @throws CategoryNotFoundException If the category with the specified ID does not exist.
   */
  async execute(query: GetCategoryByIdQuery): Promise<CategoryOutputDto> {
    // 1. Create the domain Identifier from the primitive ID in the query
    const categoryId = Identifier.create(query.categoryId);

    // 2. Use the repository to find the category by its ID
    const category = await this.categoryRepository.findById(categoryId);

    // 3. Handle the "not found" case
    if (!category) {
      throw new CategoryNotFoundException(`ID: ${query.categoryId}`);
    }

    // 4. Use the mapper to convert the found Domain Entity to an Application DTO
    const categoryDto = this.categoryMapper.toDto(category);

    // 5. Return the DTO
    if (!categoryDto) {
      throw new Error(`Failed to map category with ID: ${query.categoryId}`);
    }
    return categoryDto;
  }
}
