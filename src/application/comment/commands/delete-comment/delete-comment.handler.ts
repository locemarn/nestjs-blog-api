import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './delete-comment.command';
import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import {
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from 'src/domain/comment/repositories/comment.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentCommandHandler
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly commentRepository: ICommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { commentId, userId } = command;
    const commentIdentifier = Identifier.create(commentId);
    const userIdentifier = Identifier.create(userId);

    // 1. Fetch Comment
    const comment = await this.commentRepository.findById(commentIdentifier);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found.`);
    }

    // 2. Authorization Check (using the entity's helper method)
    if (!comment.isAuthoredBy(userIdentifier)) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment.',
      );
    }

    // 3. Apply Deletion Logic (stages event via BaseEntity.addDomainEvent)
    comment.delete();

    // 4. Get events *before* potentially invalidating the entity instance (if repo.delete does that)
    const eventsToPublish = [...comment.domainEvents];

    // 5. Persist Changes (Actual Deletion)
    await this.commentRepository.delete(comment.id);

    // 6. Publish Domain Events (using the copy)
    if (eventsToPublish.length > 0) {
      await this.eventBus.publishAll(eventsToPublish);
      comment.clearEvents();
    }
  }
}
