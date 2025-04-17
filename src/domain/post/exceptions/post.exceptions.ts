export abstract class PostException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ArgumentInvalidException extends PostException {}
export class ArgumentNotProvidedException extends PostException {}
export class ArgumentOutOfRangeException extends PostException {}

export class PostNotFoundException extends PostException {
  constructor(criteria: string) {
    super(`Post not found matching criteria: ${criteria}`);
  }
}

export class PostContentMissingException extends PostException {
  constructor(
    message: string = 'Post content cannot be empty when publishing.',
  ) {
    super(message);
  }
}

export class PostIsAlreadyPublishedException extends PostException {
  constructor(postId: string | number) {
    super(`Post with ID ${postId} is already published.`);
  }
}

export class PostIsNotPublishedException extends PostException {
  constructor(postId: string | number) {
    super(`Post with ID ${postId} is not published.`);
  }
}

export class CategoryAssociationException extends PostException {}
