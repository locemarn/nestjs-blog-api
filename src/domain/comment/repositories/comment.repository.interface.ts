import { Identifier } from 'src/domain/shared/identifier';
import { Comment } from '../entities/comment.entity';

export interface ICommentRepository {
  saveComment(comment: Comment): Promise<Comment>;
  update(comment: Comment): Promise<Comment>;
  delete(id: Identifier): Promise<void>;
  findById(id: Identifier): Promise<Comment | null>;
}

export const COMMENT_REPOSITORY_TOKEN = Symbol('ICommentRepository');
