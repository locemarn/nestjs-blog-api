/* eslint-disable @typescript-eslint/unbound-method */
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { CATEGORY_MAPPER_TOKEN } from '../../mappers/category.mapper';
import { GetCategoryByIdQueryHandler } from './get-category-by-id.handler';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { Category } from 'src/domain/category/entities/category.entity';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryOutputDto } from './get-category-by-id.dto';
import { GetCategoryByIdQuery } from './get-category-by-id.query';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';

const mockCategoryRepository: DeepMockProxy<ICategoryRepository> =
  mockDeep<ICategoryRepository>();

const mockCategoryMapper = {
  toDto: vi.fn(),
  toDtos: vi.fn(),
};

describe('GetCategoryByIdQueryHandler', () => {
  let handler: GetCategoryByIdQueryHandler;
  let repository: ICategoryRepository;
  let moduleRef: TestingModule;

  // --- Test Data ---
  const categoryId = Identifier.create(1);
  const categoryName = 'Technology';
  const categoryProps = { name: CategoryName.create(categoryName) };
  const categoryEntity = Category.create(categoryProps, categoryId);

  const categoryDto: CategoryOutputDto = {
    id: categoryId.Value as number,
    name: categoryName,
  };
  // --- End Test Data ---

  beforeEach(async () => {
    vi.resetAllMocks();

    mockCategoryRepository.findById.mockReset();

    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        GetCategoryByIdQueryHandler,
        { provide: CATEGORY_MAPPER_TOKEN, useValue: mockCategoryMapper },
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    handler = moduleRef.get<GetCategoryByIdQueryHandler>(
      GetCategoryByIdQueryHandler,
    );
    repository = moduleRef.get<ICategoryRepository>(CATEGORY_REPOSITORY_TOKEN);
  });

  it('should find a category by id, map it, and return DTO', async () => {
    const query = new GetCategoryByIdQuery(categoryId.Value as number);
    (repository.findById as Mock).mockResolvedValue(categoryEntity);
    mockCategoryMapper.toDto.mockReturnValue(categoryDto);

    const result = await handler.execute(query);

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith(categoryId);

    expect(mockCategoryMapper.toDto).toHaveBeenCalledTimes(1);
    expect(mockCategoryMapper.toDto).toHaveBeenCalledWith(categoryEntity);

    expect(result).toEqual(categoryDto);
  });

  it('should throw CategoryNotFoundException if repository returns null', async () => {
    // Arrange
    const query = new GetCategoryByIdQuery(999); // Non-existent ID
    // Configure mock repository to return null
    (repository.findById as Mock).mockResolvedValue(null);

    // Act & Assert
    // Expect the handler to throw the specific domain exception
    await expect(handler.execute(query)).rejects.toThrow(
      CategoryNotFoundException,
    );
    await expect(handler.execute(query)).rejects.toThrow(
      'Category not found matching criteria: ID: 999',
    ); // Check message

    // Assert repository was called
    expect(repository.findById).toHaveBeenCalledTimes(2); // Called twice due to rejects.toThrow structure potentially
    expect(repository.findById).toHaveBeenCalledWith(Identifier.create(999));

    // Assert mapper was NOT called
    expect(mockCategoryMapper.toDto).not.toHaveBeenCalled();
  });

  it('should throw error if mapper returns null unexpectedly', async () => {
    // Arrange
    const query = new GetCategoryByIdQuery(categoryId.Value as number);
    (repository.findById as Mock).mockResolvedValue(categoryEntity); // Repository finds the entity
    mockCategoryMapper.toDto.mockReturnValue(null); // Simulate mapper failing

    // Act & Assert
    await expect(handler.execute(query)).rejects.toThrow(
      `Failed to map category with ID: ${categoryId.Value}`,
    );

    // Assert repository and mapper were called
    expect(repository.findById).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryMapper.toDto).toHaveBeenCalledWith(categoryEntity);
  });
});
