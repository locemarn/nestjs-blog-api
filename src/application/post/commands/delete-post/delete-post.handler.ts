import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DeletePostCommand } from './delete-post.command';
import { DeletePostOutputDto } from './delete-post.dto';
import { Inject, Logger } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { PostDeletedEvent } from 'src/domain/post/events/post-deleted.event';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';

@CommandHandler(DeletePostCommand)
export class DeletePostCommandHandler
  implements ICommandHandler<DeletePostCommand, DeletePostOutputDto>
{
  private readonly logger = new Logger(DeletePostCommandHandler.name);

  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    // private readonly eventBus: EventBus,
    @Inject('EventBus')
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeletePostCommand): Promise<DeletePostOutputDto> {
    const postId = Identifier.create(command.postId);

    const hasPost = await this.postRepository.findById(postId.Value as number);
    if (!hasPost) {
      this.logger.warn(`Post with ID ${postId.Value} not found`);
      throw new PostNotFoundException(
        `Post with ID ${command.postId} not found for deletion.`,
      );
    }

    let deleted = false;
    try {
      deleted = await this.postRepository.delete(postId.Value as number);
    } catch (error) {
      this.logger.error(`Error deleting post with ID ${postId.Value}`, error);
      throw error;
    }

    if (deleted) {
      this.logger.log(`Post with ID ${postId.Value} deleted successfully`);
      this.eventBus.publish(new PostDeletedEvent(postId));
    } else {
      this.logger.warn(`Failed to delete post with ID ${postId.Value}`);
    }

    return { success: deleted };
  }
}
