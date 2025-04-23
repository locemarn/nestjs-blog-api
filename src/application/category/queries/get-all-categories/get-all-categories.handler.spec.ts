/* eslint-disable @typescript-eslint/unbound-method */
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { GetAllCategoriesQueryHandler } from './get-all-categories.handler';
import {
  CATEGORY_MAPPER_TOKEN,
  CategoryMapper,
} from '../../mappers/category.mapper';
import { Category } from 'src/domain/category/entities/category.entity';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryOutputDto } from '../get-category-by-id/get-category-by-id.dto';
import { Test } from '@nestjs/testing';
import { GetAllCategoriesQuery } from './get-all-categories.query';

const mockCategoryRepository: DeepMockProxy<ICategoryRepository> =
  mockDeep<ICategoryRepository>();

describe('GetAllCategoriesQueryHandler', () => {
  let handler: GetAllCategoriesQueryHandler;
  let repository: ICategoryRepository;
  let mapper: CategoryMapper;

  const cat1 = Category.create(
    { name: CategoryName.create('Cat 1') },
    Identifier.create(1),
  );
  const cat2 = Category.create(
    { name: CategoryName.create('Cat 2') },
    Identifier.create(2),
  );
  const mockEntities = [cat1, cat2];
  const expectedDtos: CategoryOutputDto[] = [
    { id: 1, name: 'Cat 1' },
    { id: 2, name: 'Cat 2' },
  ];

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetAllCategoriesQueryHandler,
        CategoryMapper,
        { provide: CATEGORY_MAPPER_TOKEN, useExisting: CategoryMapper },
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    handler = moduleRef.get(GetAllCategoriesQueryHandler);
    repository = moduleRef.get(CATEGORY_REPOSITORY_TOKEN);
    mapper = moduleRef.get(CategoryMapper);
  });

  it('should fetch all categories, map, and return them', async () => {
    (repository.findAll as Mock).mockResolvedValue(mockEntities); // Mock repo response
    const mapperSpy = vi.spyOn(mapper, 'toDtos').mockReturnValue(expectedDtos); // Spy/mock mapper if needed

    const result = await handler.execute(new GetAllCategoriesQuery());

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith(mockEntities);
    expect(result).toEqual(expectedDtos);
  });

  it('should return an empty array if no categories exist', async () => {
    (repository.findAll as Mock).mockResolvedValue([]); // Simulate no categories found
    const mapperSpy = vi.spyOn(mapper, 'toDtos').mockReturnValue([]);

    const result = await handler.execute(new GetAllCategoriesQuery());

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith([]);
    expect(result).toEqual([]);
  });
});
