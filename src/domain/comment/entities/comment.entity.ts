import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CommentContent } from '../value-objects/comment-content.vo';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import {
  ArgumentInvalidException,
  InvalidCommentOperationException,
} from '../exceptions/comment.exceptions';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentResponse } from './comment-response.entity';
import { CommentDeletedEvent } from '../events/comment-deleted.event';

/**
 * Defines the internal properties structure of a Comment entity.
 * After creation via `Comment.create()`, all these properties are guaranteed to be set.
 */
export interface CommentProps {
  content: CommentContent;
  postId: Identifier;
  userId: Identifier;
  responses: CommentResponse[];
  created_at: Date;
  updated_at: Date;
}

export class Comment extends BaseEntity<CommentProps> {
  private constructor(props: CommentProps, id?: Identifier) {
    super(props, id);
  }

  public static create(
    creationArgs: Omit<
      CommentProps,
      'responses' | 'created_at' | 'updated_at'
    > & {
      responses?: CommentResponse[];
      created_at?: Date;
      updated_at?: Date;
    },
    id?: Identifier,
  ): Comment {
    this.validateCreationArgs(creationArgs);

    const now = new Date();

    const fullProps: CommentProps = {
      content: creationArgs.content,
      postId: creationArgs.postId,
      userId: creationArgs.userId,
      responses: creationArgs.responses ?? [],
      created_at: creationArgs.created_at ?? now,
      updated_at: creationArgs.updated_at ?? now,
    };

    const comment = new Comment(fullProps, id);

    if (!id || id.Value === 0) {
      comment.addDomainEvent(
        new CommentCreatedEvent(comment.id, comment.postId, comment.authorId),
      );
    }
    return comment;
  }

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
    return Object.freeze([...this._props.responses]);
  }
  get created_at(): Date {
    return this._props.created_at;
  }
  get updated_at(): Date {
    return this._props.updated_at;
  }

  public updateContent(newContent: CommentContent): void {
    if (!newContent) {
      throw new ArgumentNotProvidedException(
        'New content (CommentContent object) cannot be null.',
      );
    }
    if (newContent.Value.trim().length === 0) {
      throw new ArgumentInvalidException(
        'Comment content value cannot be empty or consist only of whitespace.',
      );
    }
    if (!this.content.equals(newContent)) {
      this._props.content = newContent;
      this._props.updated_at = new Date();
      this.addDomainEvent(new CommentUpdatedEvent(this.id));
    }
  }

  public addResponse(responseToAdd: CommentResponse): void {
    if (!responseToAdd) {
      throw new ArgumentNotProvidedException('Response cannot be null.');
    }
    if (!responseToAdd.commentId.equals(this.id)) {
      throw new InvalidCommentOperationException(
        'Cannot add response: it belongs to a different parent comment.',
      );
    }
    // No need for: this._props.responses = this._props.responses || [];
    const exists = this._props.responses.some((r) =>
      r.id.equals(responseToAdd.id),
    );
    if (!exists) {
      this._props.responses.push(responseToAdd);
      this._props.updated_at = new Date(); // Update timestamp
    }
  }

  public removeResponse(responseIdToRemove: Identifier): void {
    if (!responseIdToRemove) {
      throw new ArgumentNotProvidedException(
        'Response ID to remove cannot be null.',
      );
    }

    const initialLength = this._props.responses.length;
    this._props.responses = this._props.responses.filter(
      (response) => !response.id.equals(responseIdToRemove),
    );

    if (this._props.responses.length < initialLength) {
      this._props.updated_at = new Date();
    }
  }

  public isAuthoredBy(userId: Identifier): boolean {
    if (!userId) return false;
    return this.authorId.equals(userId);
  }

  public delete(): void {
    this.addDomainEvent(
      new CommentDeletedEvent(this.id, this.postId, this.authorId),
    );
  }

  private static validateCreationArgs(
    // Using Parameters utility type to get the exact type of creationArgs from Comment.create
    args: Parameters<typeof Comment.create>[0],
  ): void {
    if (!args.content) {
      throw new ArgumentNotProvidedException(
        'Comment content (CommentContent object) is required for creation.',
      );
    }
    // Assuming CommentContent.create already validated the string content itself.

    if (!args.userId) {
      throw new ArgumentNotProvidedException(
        'Comment author (userId) is required for creation.',
      );
    }
    if (!(args.userId instanceof Identifier)) {
      throw new ArgumentInvalidException(
        'Comment author (userId) must be an instance of Identifier.',
      );
    }

    if (!args.postId) {
      throw new ArgumentNotProvidedException(
        'Comment post ID (postId) is required for creation.',
      );
    }
    if (!(args.postId instanceof Identifier)) {
      throw new ArgumentInvalidException(
        'Comment post ID (postId) must be an instance of Identifier.',
      );
    }
  }
}
