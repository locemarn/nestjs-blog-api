import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentResponseDeletedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number; // ID of the CommentResponse being deleted
  readonly parentCommentId: number;
  readonly authorId: number;

  constructor(
    commentResponseId: Identifier,
    parentCommentId: Identifier,
    authorId: Identifier,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = commentResponseId.Value;
    this.parentCommentId = parentCommentId.Value;
    this.authorId = authorId.Value;
  }
}
