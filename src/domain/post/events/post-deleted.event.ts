import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class PostDeletedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredOn: Date;
  readonly postId: number;

  constructor(postId: Identifier) {
    this.aggregateId = postId.Value as number;
    this.postId = postId.Value as number;
    this.occurredOn = new Date();
  }
}
