import { IDomainEvent } from 'src/domain/shared/domain-event.interface';
import { Identifier } from 'src/domain/shared/identifier';

export class CommentResponseAddedToCommentEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredOn: Date;
  readonly responseId: number;
  readonly postId: number;
  readonly responseAuthorId: number;

  /**
   * @param parentCommentId The ID of the Comment entity that received the response.
   * @param responseId The ID of the CommentResponse entity that was added.
   * @param postId The ID of the Post that the parent comment belongs to.
   * @param responseAuthorId The ID of the User who authored the response.
   */
  constructor(
    parentCommentId: Identifier,
    responseId: Identifier,
    postId: Identifier,
    responseAuthorId: Identifier,
  ) {
    console.log('------------------');
    console.log('parentCommentId', parentCommentId);
    console.log('responseId', responseId);
    console.log('postId', postId);
    console.log('responseAuthorId', responseAuthorId);
    console.log('------------------');
    this.occurredOn = new Date();
    this.aggregateId = parentCommentId.Value;
    this.responseId = responseId.Value;
    this.postId = postId.Value;
    this.responseAuthorId = responseAuthorId.Value;
  }
}
