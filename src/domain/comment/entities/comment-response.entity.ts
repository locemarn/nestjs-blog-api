import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';

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
    // Basic validation
    if (!args.content)
      throw new ArgumentNotProvidedException('Response content is required.');
    if (!args.userId)
      throw new ArgumentNotProvidedException('Response userId is required.');
    if (!args.commentId)
      throw new ArgumentNotProvidedException(
        'Response parent commentId is required.',
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
    if (!newContent || newContent.Value.length < 3)
      throw new ArgumentNotProvidedException(
        'Response Comment content is required',
      );
    if (this._props.content.equals(newContent)) {
      return;
    }

    this._props.content = newContent;
    this.touch();
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
