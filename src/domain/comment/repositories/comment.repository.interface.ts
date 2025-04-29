import { Identifier } from 'src/domain/shared/identifier';
import { Comment } from '../entities/comment.entity';

export interface ICommentRepository {
  saveComment(comment: Comment): Promise<Comment>;
  update(comment: Comment): Promise<Comment>;
  delete(id: Identifier): Promise<boolean>;
  findById(id: Identifier): Promise<Comment>;
  getComments(limit: number, offset: number): Promise<Comment[]>;
}

export const COMMENT_REPOSITORY_TOKEN = Symbol('ICommentRepository');
