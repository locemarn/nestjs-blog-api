import { Identifier } from 'src/domain/shared/identifier';
import { Post } from '../entities/post.entity';

export interface IPostRepository {
  save(post: Post): Promise<Post>;
  update(id: Identifier, post: Post): Promise<Post | null>;
  findById(id: Identifier): Promise<Post | null>;
  delete(id: Identifier): Promise<boolean>;
  getPosts(limit: number, offset: number): Promise<Post[]>;
}
