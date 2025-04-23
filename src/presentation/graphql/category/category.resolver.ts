import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CategoryType } from './dto/types/category.type';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoryOutputDto } from 'src/application/category/queries/get-category-by-id/get-category-by-id.dto';
import { GetCategoryByIdQuery } from 'src/application/category/queries/get-category-by-id/get-category-by-id.query';
import { CategoryIdArgs } from './dto/args/category-id.args';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetAllCategoriesOutputDto } from 'src/application/category/queries/get-all-categories/get-all-categories.dto';
import { GetAllCategoriesQuery } from 'src/application/category/queries/get-all-categories/get-all-categories.query';
import { CreateCategoryCommand } from 'src/application/category/commands/create-category/create-category.command';
import { CreateCategoryInput } from './dto/inputs/create-category.input';
import { DeleteCategoryCommand } from 'src/application/category/commands/delete-category/delete-category.command';
import { DeleteCategoryOutputDto } from 'src/application/category/commands/delete-category/delete-category.dto';
import { UpdateCategoryCommand } from 'src/application/category/commands/update-category/update-category.command';
import { UpdateCategoryInput } from './dto/inputs/update-category.input';
import { DeleteCategoryPayload } from './dto/types/delete-category.payload';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/domain/user/entities/user.entity';
import { Roles } from 'src/auth/decorators/current-user.decorator';

// TODO: Define AdminGuard or similar for authorization later

@Resolver(() => CategoryType)
export class CategoryResolver {
  private readonly logger = new Logger(CategoryResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --- Queries ---

  @Query(() => CategoryType, {
    name: 'categoryById',
    nullable: true,
    description: 'Fetch a single category by its ID.',
  })
  @UseGuards(JwtAuthGuard)
  async getCategoryById(
    @Args() args: CategoryIdArgs,
  ): Promise<CategoryOutputDto | null> {
    this.logger.log(`GraphQL: Received categoryById query for ID: ${args.id}`);
    return this.queryBus.execute(new GetCategoryByIdQuery(args.id));
    // Handler throws CategoryNotFoundException if not found
  }

  @Query(() => [CategoryType], {
    name: 'categories',
    description: 'Fetch a list of all categories.',
  })
  @UseGuards(JwtAuthGuard)
  async getAllCategories(): Promise<GetAllCategoriesOutputDto> {
    // Returns CategoryOutputDto[]
    this.logger.log(`GraphQL: Received categories query`);
    return this.queryBus.execute(new GetAllCategoriesQuery());
  }

  // --- Mutations (Protected by Role) ---

  @Mutation(() => CategoryType, { description: 'Create a new category.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
    // @CurrentUser() user: AuthenticatedUser // Inject user if needed for logging/authz
  ): Promise<CategoryOutputDto> {
    this.logger.log(
      `GraphQL: Received createCategory mutation for Name: ${input.name}`,
    );
    // Handler expects CreateCategoryInputDto shape, which matches CreateCategoryInput
    const command = new CreateCategoryCommand(input);
    // Command handler returns the created CategoryOutputDto (after fetching it)
    return this.commandBus.execute(command);
    // Handles AppCategoryNameAlreadyExistsException, Domain Validation Exceptions
  }

  @Mutation(() => CategoryType, {
    description: 'Update an existing category name.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategory(
    @Args('id', { type: () => ID }) id: number,
    @Args('input') input: UpdateCategoryInput,
    // @CurrentUser() user: AuthenticatedUser
  ): Promise<CategoryOutputDto> {
    this.logger.log(`GraphQL: Received updateCategory mutation for ID: ${id}`);
    const command = new UpdateCategoryCommand(id, input);
    // Command handler returns the updated CategoryOutputDto
    return this.commandBus.execute(command);
    // Handles CategoryNotFoundException, AppCategoryNameAlreadyExistsException, Domain Validation Exceptions
  }

  @Mutation(() => DeleteCategoryPayload, {
    description: 'Delete a category by ID.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCategory(
    @Args() args: CategoryIdArgs, // Use ArgsType class
    // @CurrentUser() user: AuthenticatedUser
  ): Promise<DeleteCategoryOutputDto> {
    // Returns { success: boolean, message?: string }
    this.logger.log(
      `GraphQL: Received deleteCategory mutation for ID: ${args.id}`,
    );
    const command = new DeleteCategoryCommand(args.id);
    // Command handler returns DeleteCategoryOutputDto
    return this.commandBus.execute(command);
    // Handles CategoryNotFoundException, CategoryInUseException
  }
}
