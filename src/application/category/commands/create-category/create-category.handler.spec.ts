/* eslint-disable @typescript-eslint/unbound-method */
import { EventBus, QueryBus, CqrsModule } from '@nestjs/cqrs';
import { Category } from 'src/domain/category/entities/category.entity';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';
import { CreateCategoryCommand } from './create-category.command';
import { CreateCategoryCommandHandler } from './create-category.handler';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CategoryMapper,
  CATEGORY_MAPPER_TOKEN,
} from '../../mappers/category.mapper';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';
import { AppCategoryNameAlreadyExistsException } from '../../exceptions/category-app.exception';
import { ArgumentOutOfRangeException } from 'src/domain/exceptions/domain.exceptions';

// Mocks
const mockCategoryRepository: DeepMockProxy<ICategoryRepository> =
  mockDeep<ICategoryRepository>();
const mockEventBus: DeepMockProxy<EventBus> = mockDeep<EventBus>();
const mockQueryBus: DeepMockProxy<QueryBus> = mockDeep<QueryBus>();
const mockCategoryMapper: DeepMockProxy<CategoryMapper> =
  mockDeep<CategoryMapper>();

describe('CreateCategoryCommandHandler', () => {
  let handler: CreateCategoryCommandHandler;
  let repository: DeepMockProxy<ICategoryRepository>;
  let eventBus: DeepMockProxy<EventBus>;
  let queryBus: DeepMockProxy<QueryBus>;
  let moduleRef: TestingModule;

  // Test data
  const categoryName = 'New Category name';
  const commandInput = { name: categoryName };
  const command = new CreateCategoryCommand(commandInput);
  const savedCategoryId = Identifier.create(1);
  const mockSavedCategoryEntity = Category.create(
    { name: CategoryName.create(categoryName) },
    savedCategoryId,
  );
  vi.spyOn(mockSavedCategoryEntity, 'publishEvents').mockResolvedValue(
    undefined,
  ); // Spy on instance method
  const expectedOutputDto: CategoryOutputDto = { id: 1, name: categoryName };
  beforeEach(async () => {
    vi.resetAllMocks();

    // Reset spy
    vi.spyOn(mockSavedCategoryEntity, 'publishEvents').mockResolvedValue(
      undefined,
    );

    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        CreateCategoryCommandHandler,
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,
        },
        CategoryMapper,
        { provide: CATEGORY_MAPPER_TOKEN, useValue: mockCategoryMapper },
        { provide: EventBus, useValue: mockEventBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    })
      .overrideProvider(EventBus)
      .useValue(mockEventBus)
      .overrideProvider(QueryBus)
      .useValue(mockQueryBus)
      .compile();
    handler = moduleRef.get(CreateCategoryCommandHandler);
    repository = moduleRef.get(CATEGORY_REPOSITORY_TOKEN);
    eventBus = moduleRef.get(EventBus);
    queryBus = moduleRef.get(QueryBus);

    // Setup mock return values for the specific test scenario
    repository.findByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(mockSavedCategoryEntity); // Return the instance with the spy
    queryBus.execute.mockResolvedValue(expectedOutputDto);
    // mapper.toDto.mockReturnValue(expectedOutputDto); // If mapper was used

    // Default mocks
    repository.findByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(mockSavedCategoryEntity);
    queryBus.execute.mockResolvedValue(expectedOutputDto);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('should create category successfully', async () => {
    const result = await handler.execute(command);

    expect(repository.findByName).toHaveBeenCalledWith(
      CategoryName.create(categoryName),
    );
    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedEntityArg = repository.save.mock.calls[0][0];
    expect(savedEntityArg).toBeInstanceOf(Category);
    expect(savedEntityArg.name.Value).toBe(categoryName);
    expect(mockSavedCategoryEntity.publishEvents).toHaveBeenCalledWith(
      eventBus,
    );
    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetCategoryByIdQuery(savedCategoryId.Value),
    );
    expect(result).toEqual(expectedOutputDto);
  });

  it('should throw AppCategoryNameAlreadyExistsException if name exists', async () => {
    const existingCategory = Category.create(
      { name: CategoryName.create(categoryName) },
      Identifier.create(99),
    );
    repository.findByName.mockResolvedValue(existingCategory);

    await expect(handler.execute(command)).rejects.toThrow(
      AppCategoryNameAlreadyExistsException,
    );
    await expect(handler.execute(command)).rejects.toThrow(
      `Category name "${categoryName}" is already in use.`,
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation errors (e.g., invalid name)', async () => {
    const invalidCommand = new CreateCategoryCommand({ name: 'a' });
    await expect(handler.execute(invalidCommand)).rejects.toThrow(
      ArgumentOutOfRangeException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
