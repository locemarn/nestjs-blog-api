import { IDomainEvent } from '../../shared/domain-event.interface';
import { Identifier } from '../../shared/identifier';

export class PostUpdatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number | string; // Post ID
  readonly changedFields: Array<'title' | 'content' | 'categories'>;

  constructor(
    postId: Identifier,
    changedFields?: Array<'title' | 'content' | 'categories'>,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = postId.Value;
    this.changedFields = changedFields || [];
  }
}
