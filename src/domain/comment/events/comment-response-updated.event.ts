import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentResponseUpdatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number; // ID of the CommentResponse
  readonly parentCommentId: number;

  constructor(commentResponseId: Identifier, parentCommentId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = commentResponseId.Value;
    this.parentCommentId = parentCommentId.Value;
  }
}
