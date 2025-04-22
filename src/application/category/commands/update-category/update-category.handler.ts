import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdateCategoryCommand } from './update-category.command';
import { UpdateCategoryOutputDto } from './update-category.dto';
import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { AppCategoryNameAlreadyExistsException } from '../../exceptions/category-app.exception';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryCommandHandler
  implements ICommandHandler<UpdateCategoryCommand, UpdateCategoryOutputDto>
{
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryOutputDto> {
    const categoryId = Identifier.create(command.categoryId);
    const newNameInput = command.input.name;

    // 1. Fetch existing Category
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(`ID: ${command.categoryId}`);
    }

    // 2. Create new Name VO (this validates the input string)
    const newCategoryName = CategoryName.create(newNameInput);

    // 3. Check if name actually changed
    if (category.name.equals(newCategoryName)) {
      // If name hasn't changed, no need to check uniqueness or save.
      // Just fetch and return the current DTO state.
      category.clearEvents(); // Clear any potential events if logic allows adding them before check
      const currentDto = await this.queryBus.execute<
        GetCategoryByIdQuery,
        CategoryOutputDto | null
      >(new GetCategoryByIdQuery(categoryId.Value as number));
      if (!currentDto)
        throw new Error(
          `Failed to fetch category ID: ${categoryId.Value} even though it exists.`,
        );
      return currentDto;
    }

    // 4. Application Rule: Check if new name is already taken by ANOTHER category
    const existingByName =
      await this.categoryRepository.findByName(newCategoryName);
    if (existingByName && !existingByName.id.equals(categoryId)) {
      // Throw application-specific exception for uniqueness violation
      throw new AppCategoryNameAlreadyExistsException(newNameInput);
    }

    // 5. Update Domain Entity (this adds CategoryUpdatedEvent)
    category.updateName(newCategoryName);

    // 6. Persist Changes
    const savedCategory = await this.categoryRepository.save(category);

    // 7. Publish Domain Events
    await savedCategory.publishEvents(this.eventBus);

    // 8. Return updated DTO (fetch via QueryBus)
    const resultDto = await this.queryBus.execute<
      GetCategoryByIdQuery,
      CategoryOutputDto | null
    >(new GetCategoryByIdQuery(savedCategory.id.Value as number));
    if (!resultDto) {
      throw new Error(
        `Failed to fetch updated category with ID: ${savedCategory.id.Value}.`,
      );
    }
    return resultDto;
  }
}
