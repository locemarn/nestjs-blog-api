import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentDeletedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number;
  readonly postId: number;
  readonly authorId: number;

  constructor(commentId: Identifier, postId: Identifier, authorId: Identifier) {
    this.occurredOn = new Date();
    this.aggregateId = commentId.Value;
    this.postId = postId.Value;
    this.authorId = authorId.Value;
  }
}
