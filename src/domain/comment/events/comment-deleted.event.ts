import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentDeletedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number;

  constructor(commentId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = commentId.Value as number;
  }
}
