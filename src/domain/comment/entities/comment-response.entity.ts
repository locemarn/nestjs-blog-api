import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
} from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CommentResponseUpdatedEvent } from '../events/comment-response-updated.event';
import { CommentResponseDeletedEvent } from '../events/comment-response-deleted.event';

export interface CommentResponseProps {
  content: CommentContent;
  userId: Identifier;
  commentId: Identifier;
  created_at: Date;
  updated_at: Date;
}

export class CommentResponse extends BaseEntity<CommentResponseProps> {
  private constructor(props: CommentResponseProps, id?: Identifier) {
    super(props, id);
  }

  static create(
    args: Omit<CommentResponseProps, 'created_at' | 'updated_at'> & {
      created_at?: Date;
      updated_at?: Date;
    },
    id?: Identifier,
  ): CommentResponse {
    // Validation from your entity
    if (!args.content)
      throw new ArgumentNotProvidedException(
        'Response content (CommentContent object) is required.',
      );
    if (args.content.Value.trim().length === 0)
      throw new ArgumentInvalidException(
        'Response content value cannot be empty.',
      ); // From VO, but good safety
    if (!args.userId)
      throw new ArgumentNotProvidedException('Response userId is required.');
    if (!(args.userId instanceof Identifier))
      throw new ArgumentInvalidException(
        'Response userId must be an Identifier instance.',
      );
    if (!args.commentId)
      throw new ArgumentNotProvidedException(
        'Response parent commentId is required.',
      );
    if (!(args.commentId instanceof Identifier))
      throw new ArgumentInvalidException(
        'Response parent commentId must be an Identifier instance.',
      );

    const now = new Date();
    const fullProps: CommentResponseProps = {
      content: args.content,
      userId: args.userId,
      commentId: args.commentId,
      created_at: args.created_at ?? now,
      updated_at: args.updated_at ?? now,
    };
    return new CommentResponse(fullProps, id);
  }

  // --- Getters for safe access ---
  get content(): CommentContent {
    return this._props.content;
  }

  get userId(): Identifier {
    return this._props.userId;
  }

  get commentId(): Identifier {
    return this._props.commentId;
  }

  get created_at(): Date {
    return this._props.created_at;
  }

  get updated_at(): Date {
    return this._props.updated_at;
  }

  // --- Business Logic Methods ---

  public updateContent(newContent: CommentContent): void {
    if (!newContent) {
      throw new ArgumentNotProvidedException(
        'New content (CommentContent object) cannot be null.',
      );
    }
    // Rule from your entity: content length must be >= 3 for CommentResponse
    if (newContent.Value.trim().length < 3) {
      throw new ArgumentInvalidException(
        'Response content must be at least 3 characters long.',
      );
    }

    if (!this._props.content.equals(newContent)) {
      this._props.content = newContent;
      this.touch();
      this.addDomainEvent(
        new CommentResponseUpdatedEvent(this.id, this.commentId),
      );
    }
  }

  // Assuming CommentResponse can be deleted
  public delete(): void {
    this.addDomainEvent(
      new CommentResponseDeletedEvent(this.id, this.commentId, this.userId),
    );
    // Note: Actual deletion from DB is a repository concern.
    // You might set a flag here if using soft deletes e.g. this._props.isDeleted = true; and this.touch();
  }

  // --- Validation ---
  private static validateProps(props: CommentResponseProps): void {
    if (!props.content)
      throw new ArgumentNotProvidedException(
        'Response Comment content is required',
      );

    if (props.content.Value.length < 3)
      throw new ArgumentNotProvidedException(
        'Response Comment content is too short',
      );

    if (!props.userId)
      throw new ArgumentNotProvidedException(
        'Response Comment userId is required',
      );

    if (!(props.userId instanceof Identifier))
      throw new ArgumentNotProvidedException(
        'Response Comment userId must be an instance of Identifier',
      );

    if (!props.commentId)
      throw new ArgumentNotProvidedException(
        'Response Comment commentId is required',
      );

    if (!(props.commentId instanceof Identifier))
      throw new ArgumentNotProvidedException(
        'Response Comment commentId must be an instance of Identifier',
      );
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
