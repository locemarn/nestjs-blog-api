import { ICommand } from '@nestjs/cqrs';

/**
 * Command to delete a comment.
 * Requires the ID of the comment to delete and the ID of the user attempting the deletion
 * for authorization purposes.
 */
export class DeleteCommentCommand implements ICommand {
  constructor(
    public readonly commentId: number,
    public readonly userId: number,
  ) {}
}
