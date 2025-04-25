import { ApplicationException } from 'src/application/user/shared/exceptions/application.exception';

export class CommentApplicationException extends ApplicationException {}

// Example exceptions for application rules
export class ParentCommentNotFoundException extends CommentApplicationException {
  constructor(commentId: string | number) {
    super(`Parent comment with ID ${commentId} not found when adding reply.`);
  }
}

export class PostNotFoundForCommentException extends CommentApplicationException {
  constructor(postId: string | number) {
    super(`Post with ID ${postId} not found when creating comment/reply.`);
  }
}
