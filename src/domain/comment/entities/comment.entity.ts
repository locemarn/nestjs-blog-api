import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';

export interface CommentProps {
  content: string;
  postId: Identifier;
  userId: Identifier;
  created_at: Date;
  updated_at: Date;
}

export class Comment extends BaseEntity<CommentProps> {
  private constructor(props: CommentProps, id?: Identifier) {
    super(props, id);
  }

  public static create(props: CommentProps, id?: Identifier): Comment {
    this.validateProps(props);
    const now = new Date();
    const commentProps: CommentProps = {
      ...props,
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };
    const comment = new Comment(commentProps, id);
    return comment;
  }

  // --- Getters for safe access ---
  get content(): string {
    return this._props.content;
  }

  get postId(): Identifier {
    return this._props.postId;
  }

  get userId(): Identifier {
    return this._props.userId;
  }

  get created_at(): Date {
    return this._props.created_at;
  }

  get updated_at(): Date {
    return this._props.updated_at;
  }

  // --- Business Logic Methods ---

  public updateContent(newContent: string): void {
    if (!newContent)
      throw new ArgumentNotProvidedException(
        'Comment newContent must be provide',
      );
    this._props.content = newContent;
    this.touch();
  }

  // --- Validation ---
  private static validateProps(props: CommentProps): void {
    if (!props.content)
      throw new ArgumentNotProvidedException('Comment content is required');

    if (props.content.length < 3)
      throw new ArgumentNotProvidedException(
        'Comment content must be more than 3 chars',
      );

    if (!(props.postId instanceof Identifier))
      throw new ArgumentNotProvidedException(
        'Comment postId must be an identifier type',
      );

    if (!(props.userId instanceof Identifier))
      throw new ArgumentNotProvidedException(
        'Comment userId must be an identifier type',
      );
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
