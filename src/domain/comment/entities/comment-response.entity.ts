import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from '../value-objects/comment-content.vo';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { ArgumentNotProvidedException } from '../exceptions/comment.exceptions';
import { CommentResponseCreatedEvent } from '../events/comment-response-created.event';
import { CommentUpdatedEvent } from '../events/comment-updated.event';

export interface CommentResponseProps {
  content: CommentContent;
  userId: Identifier;
  commentId: Identifier;
  postId: Identifier;
  created_at?: Date;
  updated_at?: Date;
}

export class CommentResponse extends BaseEntity<CommentResponseProps> {
  private constructor(props: CommentResponseProps, id?: Identifier) {
    super(props, id);
  }
  public static create(
    props: CommentResponseProps,
    id?: Identifier,
  ): CommentResponse {
    this.validateProps(props);
    const now = new Date();
    const responseProps = {
      ...props,
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };
    const response = new CommentResponse(responseProps, id);

    if (!id || id.Value === 0) {
      // Add event, passing all necessary IDs
      response.addDomainEvent(
        new CommentResponseCreatedEvent(
          response.id,
          response.commentId,
          response.postId,
          response.userId,
        ),
      );
    }
    return response;
  }

  // --- Getters ---
  get content(): CommentContent {
    return this._props.content;
  }
  get userId(): Identifier {
    return this._props.userId;
  }
  get commentId(): Identifier {
    return this._props.commentId;
  }
  get postId(): Identifier {
    return this._props.postId;
  }
  get createdAt(): Date | undefined {
    return this._props.created_at;
  }
  get updatedAt(): Date | undefined {
    return this._props.updated_at;
  }

  // --- Business Methods ---
  public updateContent(newContent: CommentContent): void {
    if (!newContent)
      throw new ArgumentNotProvidedException('Response content is required.');
    if (!this.content.equals(newContent)) {
      this._props.content = newContent;
      this.touch();
      // Add CommentResponseUpdatedEvent if defined
      this.addDomainEvent(new CommentUpdatedEvent(this.id));
    }
  }

  // --- Validation ---
  private static validateProps(props: CommentResponseProps): void {
    if (!props.content)
      throw new ArgumentNotProvidedException('Response content is required.');
    if (!props.userId)
      throw new ArgumentNotProvidedException(
        'Response author (userId) is required.',
      );
    if (!props.commentId)
      throw new ArgumentNotProvidedException(
        'Response parent comment ID (commentId) is required.',
      );
    if (!props.postId)
      throw new ArgumentNotProvidedException(
        'Response post ID (postId) is required.',
      );
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
