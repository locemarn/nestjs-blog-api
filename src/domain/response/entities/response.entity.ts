import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';

export interface ResponseProps {
  content: string;
  userId: Identifier;
  commentId: Identifier;
  created_at: Date;
  updated_at: Date;
}

export class Response extends BaseEntity<ResponseProps> {
  private constructor(props: ResponseProps, id?: Identifier) {
    super(props, id);
  }

  static create(props: ResponseProps, id?: Identifier): Response {
    this.validateProps(props);
    const now = new Date();
    const responseProps: ResponseProps = {
      ...props,
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };

    const response = new Response(responseProps, id);
    return response;
  }

  // --- Getters for safe access ---
  get content(): string {
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

  public updateContent(newContent: string): void {
    if (!newContent || newContent.length < 3)
      throw new ArgumentNotProvidedException(
        'Response Comment content is required',
      );

    this._props.content = newContent;
    this.touch();
  }

  // --- Validation ---
  private static validateProps(props: ResponseProps): void {
    if (!props.content)
      throw new ArgumentNotProvidedException(
        'Response Comment content is required',
      );

    if (props.content.length < 3)
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
