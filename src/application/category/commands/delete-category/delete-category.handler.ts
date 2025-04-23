import { Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CategoryDeletedEvent } from 'src/domain/category/events/category-deleted.event';
import { CategoryNotFoundException } from 'src/domain/category/exceptions/category.exceptions';
import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from 'src/domain/category/repositories/category.repository.interface';
import {
  POST_REPOSITORY_TOKEN,
  IPostRepository,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryInUseException } from '../../exceptions/category-app.exception';
import { DeleteCategoryCommand } from './delete-category.command';
import { DeleteCategoryOutputDto } from './delete-category.dto';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryCommandHandler
  implements ICommandHandler<DeleteCategoryCommand, DeleteCategoryOutputDto>
{
  private readonly logger = new Logger(DeleteCategoryCommandHandler.name);

  constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: DeleteCategoryCommand,
  ): Promise<DeleteCategoryOutputDto> {
    const categoryId = Identifier.create(command.categoryId);

    // 1. Check if Category exists
    const categoryExists = await this.categoryRepository.findById(categoryId);
    if (!categoryExists) {
      throw new CategoryNotFoundException(
        `Category with ID ${command.categoryId} not found for deletion.`,
      );
    }

    // 2. Application Rule: Check if Category is in use by any Posts
    // Ensure IPostRepository has a count method supporting categoryId filter
    let postCount = 0;
    if (typeof this.postRepository.count === 'function') {
      postCount = await this.postRepository.count({ categoryId: categoryId });
    } else {
      this.logger.warn(
        `IPostRepository 'count' method unavailable. Cannot check if category ${categoryId.Value} is in use.`,
      );
      // Decide behavior: Proceed with delete (risky) or throw error? Let's throw.
      throw new Error(
        `Cannot verify category usage. Aborting delete for category ID ${categoryId.Value}.`,
      );
    }

    if (postCount > 0) {
      this.logger.warn(
        `Attempted to delete category ID ${categoryId.Value} which is used by ${postCount} post(s).`,
      );
      throw new CategoryInUseException(categoryId.Value);
    }

    // 3. Attempt Deletion via Repository
    let deleted = false;
    try {
      deleted = await this.categoryRepository.delete(categoryId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error during category deletion for ID ${categoryId.Value}: ${err.message}`,
        err.stack,
      );
      throw err;
    }

    // 4. Publish Event ONLY if deletion succeeded
    if (deleted) {
      this.logger.log(
        `Category deleted successfully: ${categoryId.Value}. Publishing event...`,
      );
      this.eventBus.publish(new CategoryDeletedEvent(categoryId));
    } else {
      // This means findById found it, count was 0, but delete returned false (e.g., race condition)
      this.logger.warn(
        `Category repository indicated deletion failed for ID ${categoryId.Value} (possibly already deleted).`,
      );
    }

    // 5. Return result
    return { success: deleted };
  }
}
