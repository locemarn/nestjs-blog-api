import { IDomainEvent } from '../../shared/domain-event.interface';
import { Identifier } from '../../shared/identifier';

export class PostCreatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string;
  readonly authorId: number;

  constructor(postId: Identifier, authorId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = +postId.Value;
    this.authorId = +authorId.Value;
  }
}
