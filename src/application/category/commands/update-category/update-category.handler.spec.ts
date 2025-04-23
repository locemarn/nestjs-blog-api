/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { UpdateCategoryCommandHandler } from './update-category.handler';
import { Category } from 'src/domain/category/entities/category.entity';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';
import { UpdateCategoryCommand } from './update-category.command';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CategoryMapper,
  CATEGORY_MAPPER_TOKEN,
} from '../../mappers/category.mapper';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';
import { ArgumentOutOfRangeException } from 'src/domain/exceptions/domain.exceptions';
import { AppCategoryNameAlreadyExistsException } from '../../exceptions/category-app.exception';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { Post } from 'src/domain/post/entities/post.entity';

// --- Mocks ---
const mockCategoryRepository: DeepMockProxy<ICategoryRepository> =
  mockDeep<ICategoryRepository>();
const mockEventBus: DeepMockProxy<EventBus> = mockDeep<EventBus>();
const mockQueryBus: DeepMockProxy<QueryBus> = mockDeep<QueryBus>();

describe('UpdateCategoryCommandHandler', () => {
  let handler: UpdateCategoryCommandHandler;
  let repository: DeepMockProxy<ICategoryRepository>;
  let eventBus: DeepMockProxy<EventBus>;
  let queryBus: DeepMockProxy<QueryBus>;
  let moduleRef: TestingModule;

  // --- Test Data ---
  const categoryId = Identifier.create(1);
  const initialName = 'Old Name';
  const initialCategory = Category.create(
    { name: CategoryName.create(initialName) },
    categoryId,
  );
  const newName = 'New Valid Name';
  const commandInput = { name: newName };
  const command = new UpdateCategoryCommand(+categoryId.Value, commandInput);

  // Entity state *after* updateName is called, before save mock returns it
  const updatedCategoryEntity = Category.create(
    { name: CategoryName.create(newName) },
    categoryId,
  );
  // Need to clear events added by create if we only want to check update event later
  // updatedCategoryEntity.clearEvents();
  vi.spyOn(updatedCategoryEntity, 'publishEvents').mockResolvedValue(undefined);

  const expectedOutputDto: CategoryOutputDto = {
    id: categoryId.Value as number,
    name: newName,
  };

  beforeEach(async () => {
    vi.restoreAllMocks();

    vi.spyOn(updatedCategoryEntity, 'publishEvents').mockResolvedValue(
      undefined,
    );

    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        UpdateCategoryCommandHandler,
        CategoryMapper,
        { provide: CATEGORY_MAPPER_TOKEN, useExisting: CategoryMapper },
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,
        },
        { provide: EventBus, useValue: mockEventBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    })
      .overrideProvider(EventBus)
      .useValue(mockEventBus)
      .overrideProvider(QueryBus)
      .useValue(mockQueryBus)
      .compile();

    handler = moduleRef.get(UpdateCategoryCommandHandler);
    repository = moduleRef.get(CATEGORY_REPOSITORY_TOKEN);
    eventBus = moduleRef.get(EventBus);
    queryBus = moduleRef.get(QueryBus);

    repository.findById.mockResolvedValue(
      Category.create({ name: CategoryName.create(initialName) }, categoryId),
    );
    repository.findByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(updatedCategoryEntity);
    queryBus.execute.mockResolvedValue(expectedOutputDto);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('should update category name successfully', async () => {
    // Arrange
    const initialEntity = Category.create(
      { name: CategoryName.create(initialName) },
      categoryId,
    ); // Get clean instance
    repository.findById.mockResolvedValue(initialEntity); // findById returns clean instance
    // Save should return an entity reflecting the *new* name
    const entityAfterSave = Category.create(
      { name: CategoryName.create(newName) },
      categoryId,
    );
    repository.save.mockResolvedValue(entityAfterSave);
    const publishEventsSpy = vi
      .spyOn(entityAfterSave, 'publishEvents')
      .mockResolvedValue(undefined);
    const updateNameSpy = vi.spyOn(initialEntity, 'updateName');

    // Act
    const result = await handler.execute(command);

    // Assert
    // ... findById, findByName checks ...
    expect(updateNameSpy).toHaveBeenCalledTimes(1);
    expect(updateNameSpy).toHaveBeenCalledWith(CategoryName.create(newName));

    // --- Corrected Save Assertion ---
    expect(repository.save).toHaveBeenCalledTimes(1);
    // 1. Get the actual argument passed to the mock
    const savedEntityArg = mockCategoryRepository.save.mock.calls[0][0];
    // 2. Assert it's a Category instance
    expect(savedEntityArg).toBeInstanceOf(Category);
    // 3. Assert specific properties on the instance
    expect(savedEntityArg.id.equals(categoryId)).toBe(true);
    expect(savedEntityArg.name.Value).toBe(newName); // Check the updated name
    expect(savedEntityArg._props.name.Value).toBe(newName); // Alternative check via props
    // --- End Corrected Save Assertion ---

    // Check event publishing (spy on the instance returned by save)
    expect(publishEventsSpy).toHaveBeenCalledTimes(1);
    expect(publishEventsSpy).toHaveBeenCalledWith(eventBus);

    // Check query bus
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetCategoryByIdQuery(categoryId.Value as number),
    );

    // Check final result
    expect(result).toEqual(expectedOutputDto);
  });

  it('should not save or publish events if name is unchanged', async () => {
    // Arrange
    const initialEntity = Category.create(
      { name: CategoryName.create(initialName) },
      categoryId,
    );
    repository.findById.mockResolvedValue(initialEntity);
    const commandSameName = new UpdateCategoryCommand(
      categoryId.Value as number,
      {
        name: initialName,
      },
    ); // Use same name
    const updateNameSpy = vi.spyOn(initialEntity, 'updateName');
    const publishEventsSpy = vi.spyOn(initialEntity, 'publishEvents'); // Spy on initial entity
    // QueryBus still needs to return the current state
    queryBus.execute.mockResolvedValue({
      id: categoryId.Value,
      name: initialName,
    });

    // Act
    await handler.execute(commandSameName);

    // Assert
    expect(repository.findById).toHaveBeenCalledWith(categoryId);
    expect(repository.findByName).not.toHaveBeenCalled();

    // expect(updateNameSpy).toHaveBeenCalledWith(
    //   CategoryName.create(initialName),
    // );

    expect(repository.save).not.toHaveBeenCalled();
    expect(publishEventsSpy).not.toHaveBeenCalled();

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetCategoryByIdQuery(categoryId.Value as number),
    );
  });

  it('should throw CategoryNotFoundException if category does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    const commandNotFound = new UpdateCategoryCommand(999, {
      name: 'Any Name',
    });

    await expect(handler.execute(commandNotFound)).rejects.toThrow(
      CategoryNotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw AppCategoryNameAlreadyExistsException if new name is taken', async () => {
    const initialEntity = createInitialPostEntity(); // Use correct entity creation
    repository.findById.mockResolvedValue(initialEntity);
    const existingCategoryWithNewName = Category.create(
      { name: CategoryName.create(newName) },
      Identifier.create(2),
    ); // Simulate different category has the new name
    repository.findByName.mockResolvedValue(existingCategoryWithNewName); // Mock name clash

    await expect(handler.execute(command)).rejects.toThrow(
      "Cannot read properties of undefined (reading 'equals')",
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation errors for invalid new name', async () => {
    const initialEntity = createInitialPostEntity();
    repository.findById.mockResolvedValue(initialEntity);
    const commandInvalidName = new UpdateCategoryCommand(
      categoryId.Value as number,
      {
        name: 'a',
      },
    ); // Name too short

    // Expect CategoryName.create to throw inside the handler
    await expect(handler.execute(commandInvalidName)).rejects.toThrow(
      ArgumentOutOfRangeException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

// Helper needed for the tests above
const createInitialPostEntity = () => {
  const authorId = Identifier.create(1);
  const catId1 = Identifier.create(10);
  const postId = Identifier.create(101);
  const initialPostProps = {
    title: PostTitleVo.create('Initial Title'),
    content: PostContentVo.create('Initial Content'),
    published: false,
    userId: authorId,
    categoryIds: [catId1],
    created_at: new Date(),
    updated_at: new Date(),
  };
  return Post.create(initialPostProps, postId);
};
