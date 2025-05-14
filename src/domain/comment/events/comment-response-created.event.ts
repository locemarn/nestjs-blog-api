import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentResponseCreatedEvent implements IDomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: number;
  readonly parentCommentId: number;
  readonly postId: number;
  readonly responseAuthorId: number;
  readonly contentPreview: string;

  constructor(
    responseId: Identifier,
    parentCommentId: Identifier,
    postId: Identifier,
    responseAuthorId: Identifier,
    content: string,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = responseId.Value;
    this.parentCommentId = parentCommentId.Value;
    this.postId = postId.Value;
    this.responseAuthorId = responseAuthorId.Value;
    this.contentPreview =
      content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
}
