import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command';
import { CommentOutputDto } from '../../queries/dto/comment.output.dto';
import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import {
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from 'src/domain/comment/repositories/comment.repository.interface';
import { CommentMapper } from '../../mappers/comment.mapper';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { Identifier } from 'src/domain/shared/identifier';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentCommandHandler
  implements ICommandHandler<UpdateCommentCommand, CommentOutputDto>
{
  constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly commentRepository: ICommentRepository,
    private readonly commentMapper: CommentMapper,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<CommentOutputDto> {
    const { commentId, userId, content } = command;
    const commentIdentifier = Identifier.create(commentId);
    const userIdentifier = Identifier.create(userId);

    // 1. Fetch Comment
    const comment = await this.commentRepository.findById(commentIdentifier);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found.`);
    }

    // 2. Authorization Check
    if (!comment.authorId.equals(userIdentifier)) {
      throw new ForbiddenException(
        'You are not allowed to update this comment.',
      );
    }

    // 3. Update using Domain Logic
    const newContent = CommentContent.create(content);
    comment.updateContent(newContent);

    // 4. Persist Changes
    const savedComment = await this.commentRepository.update(comment);

    // 5. Publish Domain Events
    await savedComment.publishEvents(this.eventBus);

    // 6. Fetch full data for DTO (if needed, e.g., author info) and map
    const dtoData = await this.commentRepository.findById(savedComment.id);
    if (!dtoData) {
      throw new Error(
        `Failed to retrieve updated comment details for ID: ${savedComment.id.Value}`,
      );
    }
    return this.commentMapper.toDto(dtoData) as CommentOutputDto;
  }
}
