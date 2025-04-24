// Base exception
export abstract class CommentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific exceptions
export class ArgumentInvalidException extends CommentException {}
export class ArgumentNotProvidedException extends CommentException {}
export class ArgumentOutOfRangeException extends CommentException {}

export class CommentNotFoundException extends CommentException {
  constructor(criteria: string) {
    super(`Comment not found matching criteria: ${criteria}`);
  }
}

export class CommentResponseNotFoundException extends CommentException {
  constructor(criteria: string) {
    super(`Comment Response not found matching criteria: ${criteria}`);
  }
}

export class CannotReplyToOwnCommentException extends CommentException {
  constructor() {
    super(
      `User cannot reply to their own comment directly (use update instead).`,
    );
  }
  // Note: This rule might be better enforced in the Application layer.
}

export class InvalidCommentOperationException extends CommentException {}
