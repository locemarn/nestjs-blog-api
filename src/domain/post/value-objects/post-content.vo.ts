import { ArgumentNotProvidedException } from '../exceptions/post.exceptions';

export class PostContentVo {
  private constructor(private readonly value: string) {
    this.validate();
  }

  get Value(): string {
    return this.value;
  }

  static create(value: string): PostContentVo {
    return new PostContentVo(value);
  }

  equals(other?: PostContentVo): boolean {
    return other instanceof PostContentVo && this.Value === other.Value;
  }

  private validate(): void {
    if (this.value === null || this.value === undefined || this.value === '') {
      throw new ArgumentNotProvidedException(
        'Post content cannot be null, undefined or empty string',
      );
    }
  }
}
