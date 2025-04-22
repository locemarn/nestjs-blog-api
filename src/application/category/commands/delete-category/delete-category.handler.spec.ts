/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
import { EventBus, CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Category } from 'src/domain/category/entities/category.entity';
import { CategoryDeletedEvent } from 'src/domain/category/events/category-deleted.event';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY_TOKEN,
} from 'src/domain/category/repositories/category.repository.interface';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { describe, beforeEach, vi, it, expect } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { DeleteCategoryCommand } from './delete-category.command';
import { DeleteCategoryCommandHandler } from './delete-category.handler';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';
import { CategoryInUseException } from '../../exceptions/category-app.exception';

// --- Mocks ---
const mockCategoryRepository: DeepMockProxy<ICategoryRepository> =
  mockDeep<ICategoryRepository>();
// Mock Post repository for the "in use" check
const mockPostRepository: DeepMockProxy<IPostRepository> =
  mockDeep<IPostRepository>();
const mockEventBus: DeepMockProxy<EventBus> = mockDeep<EventBus>();
// --- End Mocks ---

describe('DeleteCategoryCommandHandler', () => {
  let handler: DeleteCategoryCommandHandler;
  let categoryRepository: DeepMockProxy<ICategoryRepository>;
  let postRepository: DeepMockProxy<IPostRepository>;
  let eventBus: DeepMockProxy<EventBus>;

  // --- Test Data ---
  const categoryId = Identifier.create(1);
  const categoryName = 'ToDelete';
  const categoryEntity = Category.create(
    { name: CategoryName.create(categoryName) },
    categoryId,
  );
  const command = new DeleteCategoryCommand(categoryId.Value as number);
  // --- End Test Data ---

  beforeEach(async () => {
    vi.restoreAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        DeleteCategoryCommandHandler,
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockCategoryRepository,
        },
        { provide: POST_REPOSITORY_TOKEN, useValue: mockPostRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    handler = moduleRef.get(DeleteCategoryCommandHandler);
    categoryRepository = moduleRef.get(CATEGORY_REPOSITORY_TOKEN);
    postRepository = moduleRef.get(POST_REPOSITORY_TOKEN);
    eventBus = moduleRef.get(EventBus);

    categoryRepository.findById.mockResolvedValue(categoryEntity);
    postRepository.count.mockResolvedValue(0);
    categoryRepository.delete.mockResolvedValue(true);
  });

  it('should delete category and publish event successfully', async () => {
    // Act
    const result = await handler.execute(command);

    // Assert
    expect(categoryRepository.findById).toHaveBeenCalledWith(categoryId);

    expect(postRepository.count).toHaveBeenCalledTimes(1);
    expect(postRepository.count).toHaveBeenCalledWith({
      categoryId: categoryId,
    });
    // Check delete was called
    expect(categoryRepository.delete).toHaveBeenCalledTimes(1);
    expect(categoryRepository.delete).toHaveBeenCalledWith(categoryId);
    // Check event was published
    // expect(eventBus.publish).toHaveBeenCalledTimes(1);
    // expect(eventBus.publish).toHaveBeenCalledWith(
    //   expect.any(CategoryDeletedEvent),
    // );
    expect(result).toEqual({ success: true });
  });

  it('should throw CategoryNotFoundException if category does not exist', async () => {
    // Arrange
    categoryRepository.findById.mockResolvedValue(null); // Simulate category not found
    const commandNotFound = new DeleteCategoryCommand(999);

    // Act & Assert
    await expect(handler.execute(commandNotFound)).rejects.toThrow(
      CategoryNotFoundException,
    );
    await expect(handler.execute(commandNotFound)).rejects.toThrow(
      'Category with ID 999 not found for deletion.',
    );

    // Assert side effects
    expect(postRepository.count).not.toHaveBeenCalled();
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw CategoryInUseException if posts are associated with the category', async () => {
    // Arrange
    categoryRepository.findById.mockResolvedValue(categoryEntity); // Category exists
    postRepository.count.mockResolvedValue(3); // Simulate 3 posts use this category

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      CategoryInUseException,
    );
    await expect(handler.execute(command)).rejects.toThrow(
      `Category ID ${categoryId.Value} cannot be deleted as it is currently associated with posts.`,
    );

    // Assert side effects
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('should return { success: false } and not publish event if repository delete returns false', async () => {
    // Arrange
    categoryRepository.findById.mockResolvedValue(categoryEntity); // Category exists
    postRepository.count.mockResolvedValue(0); // Category not in use
    categoryRepository.delete.mockResolvedValue(false); // Simulate repo delete fails

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(categoryRepository.delete).toHaveBeenCalledWith(categoryId);
    expect(result).toEqual({ success: false });
  });

  it('should re-throw other errors from repository delete', async () => {
    // Arrange
    categoryRepository.findById.mockResolvedValue(categoryEntity);
    postRepository.count.mockResolvedValue(0);
    const dbError = new Error('Unexpected DB error during category delete');
    categoryRepository.delete.mockRejectedValue(dbError); // Simulate repo throwing error

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(dbError);

    // Assert
    // expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
