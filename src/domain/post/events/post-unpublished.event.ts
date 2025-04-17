import { IDomainEvent } from '../../shared/domain-event.interface';
import { Identifier } from '../../shared/identifier';

export class PostUnpublishedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string; // Post ID

  constructor(postId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = postId.Value;
  }
}
