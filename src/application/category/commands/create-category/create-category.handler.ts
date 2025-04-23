import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CreateCategoryCommand } from './create-category.command';
import { CreateCategoryOutputDto } from './create-category.dto';
import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { AppCategoryNameAlreadyExistsException } from '../../exceptions/category-app.exception';
import { Category } from 'src/domain/category/entities/category.entity';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryCommandHandler
  implements ICommandHandler<CreateCategoryCommand, CreateCategoryOutputDto>
{
  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryOutputDto> {
    const { name } = command.input;

    const categoryName = CategoryName.create(name);

    const existingCategory =
      await this.categoryRepository.findByName(categoryName);
    if (existingCategory) throw new AppCategoryNameAlreadyExistsException(name);

    const category = Category.create({ name: categoryName });

    const savedCategory = await this.categoryRepository.save(category);
    await savedCategory.publishEvents(this.eventBus);

    const resultDto = await this.queryBus.execute<
      GetCategoryByIdQuery,
      CategoryOutputDto | null
    >(new GetCategoryByIdQuery(savedCategory.id.Value as number));
    if (!resultDto)
      throw new Error(
        `Failed to fetch newly created category with ID: ${savedCategory.id.Value}.`,
      );

    return resultDto;
  }
}
