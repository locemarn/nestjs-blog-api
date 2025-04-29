import {
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException,
} from 'src/domain/exceptions/domain.exceptions';

const MIN_LENGTH = 1;
const MAX_LENGTH = 1000;

export class CommentContent {
  private constructor(private readonly value: string) {
    this.validate();
  }

  get Value(): string {
    return this.value;
  }

  static create(content: string): CommentContent {
    const trimmedContent = content ? content.trim() : '';
    return new CommentContent(trimmedContent);
  }

  private validate(): void {
    if (
      this.value === null ||
      this.value === undefined ||
      this.value.length < MIN_LENGTH
    ) {
      throw new ArgumentNotProvidedException(
        'Comment content cannot be empty.',
      );
    }
    if (this.value.length > MAX_LENGTH) {
      throw new ArgumentOutOfRangeException(
        `Comment content cannot exceed ${MAX_LENGTH} characters.`,
      );
    }
  }

  equals(other?: CommentContent): boolean {
    return other instanceof CommentContent && this.value === other.Value;
  }
}
