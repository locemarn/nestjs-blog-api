import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from '../value-objects/comment-content.vo';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { InvalidCommentOperationException } from '../exceptions/comment.exceptions';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentResponse } from './comment-response.entity';

export interface CommentProps {
  content: CommentContent;
  postId: Identifier;
  userId: Identifier;
  responses?: CommentResponse[];
  created_at?: Date;
  updated_at?: Date;
}

export class Comment extends BaseEntity<CommentProps> {
  private constructor(props: CommentProps, id?: Identifier) {
    // Initialize responses array if not provided
    super({ ...props, responses: props.responses ?? [] }, id);
  }

  public static create(props: CommentProps, id?: Identifier): Comment {
    this.validateProps(props);
    const commentProps = {
      ...props,
      responses: props.responses ?? [],
    };
    const comment = new Comment(commentProps, id);

    if (!id || id.Value === 0) {
      comment.addDomainEvent(
        new CommentCreatedEvent(comment.id, comment.postId, comment.authorId),
      );
    }
    return comment;
  }

  // --- Getters ---
  get content(): CommentContent {
    return this._props.content;
  }
  get authorId(): Identifier {
    return this._props.userId;
  }
  get postId(): Identifier {
    return this._props.postId;
  }
  get responses(): ReadonlyArray<CommentResponse> {
    return this._props.responses
      ? Object.freeze([...this._props.responses])
      : [];
  }

  // --- Business Methods ---
  public updateContent(newContent: CommentContent): void {
    if (!newContent || newContent.Value.length === 0)
      throw new ArgumentNotProvidedException('Response cannot be null.');
    if (!this.content.equals(newContent)) {
      this._props.content = newContent;
      this.addDomainEvent(new CommentUpdatedEvent(this.id));
    }
  }

  // Method to add a response - This manages the relationship
  // Note: Actual creation/persistence of response happens via App layer + Repo usually
  // This domain method might just validate the addition or add an event
  public addResponse(response: CommentResponse): void {
    if (!response) {
      throw new ArgumentNotProvidedException('Response cannot be null.');
    }
    // Ensure response belongs to this comment
    if (!response.commentId.equals(this.id)) {
      throw new InvalidCommentOperationException(
        'Cannot add response to the wrong parent comment.',
      );
    }
    if (!this._props.responses) {
      this._props.responses = [];
    }

    // Check if response already exists (by ID) - prevents duplicates if list is managed here
    const exists = this._props.responses?.some((r) => r.id.equals(response.id));

    if (!exists) {
      this._props.responses?.push(response);
    }
  }

  // Method to remove a response (if needed)
  public removeResponse(responseId: Identifier): void {
    // const initialLength = this._props.responses?.length ?? 0;
    if (this._props.responses) {
      this._props.responses = this._props.responses.filter(
        (r) => !r.id.equals(responseId),
      );
    }
  }

  // --- Validation ---
  private static validateProps(props: CommentProps): void {
    if (!props.content)
      throw new ArgumentNotProvidedException('Comment content is required.');
    if (!props.userId)
      throw new ArgumentNotProvidedException(
        'Comment author (userId) is required.',
      );
    if (!props.postId)
      throw new ArgumentNotProvidedException(
        'Comment post ID (postId) is required.',
      );
  }
}
