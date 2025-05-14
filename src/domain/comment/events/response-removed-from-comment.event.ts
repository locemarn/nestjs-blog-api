import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class ResponseRemovedFromCommentEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number;
  readonly responseId: number;
  readonly postId: number;

  constructor(
    parentCommentId: Identifier,
    responseId: Identifier,
    postId: Identifier,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = parentCommentId.Value;
    this.responseId = responseId.Value;
    this.postId = postId.Value;
  }
}
