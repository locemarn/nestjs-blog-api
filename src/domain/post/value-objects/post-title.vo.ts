import {
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException,
} from '../exceptions/post.exceptions';

export class PostTitleVo {
  private constructor(private readonly value: string) {
    this.validate();
  }

  get Value(): string {
    return this.value;
  }

  static create(value: string): PostTitleVo {
    return new PostTitleVo(value);
  }

  equals(other?: PostTitleVo): boolean {
    return other instanceof PostTitleVo && this.Value === other.Value;
  }

  private validate(): void {
    if (
      this.value === null ||
      this.value === undefined ||
      this.value.trim().length === 0
    ) {
      throw new ArgumentNotProvidedException('Post title cannot be empty');
    }
    if (this.value.length > 255) {
      throw new ArgumentOutOfRangeException(
        'Post title cannot exceed 255 characters',
      );
    }
  }
}
