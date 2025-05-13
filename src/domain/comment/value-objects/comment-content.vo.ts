import {
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException,
} from 'src/domain/exceptions/domain.exceptions';

const MIN_LENGTH = 1;
const MAX_LENGTH = 1000;

export class CommentContent {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    this.validate();
  }

  get Value(): string {
    return this._value;
  }

  public static create(content: string): CommentContent {
    // Ensure content is a string and trim it; handle null/undefined gracefully before constructing.
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    return new CommentContent(trimmedContent);
  }

  private validate(): void {
    if (this._value.length < MIN_LENGTH) {
      throw new ArgumentNotProvidedException(
        `Comment content cannot be empty or less than ${MIN_LENGTH} character(s) after trimming.`,
      );
    }
    if (this._value.length > MAX_LENGTH) {
      throw new ArgumentOutOfRangeException(
        `Comment content cannot exceed ${MAX_LENGTH} characters.`,
      );
    }
  }

  public equals(other?: CommentContent): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._value === other.Value;
  }
}
