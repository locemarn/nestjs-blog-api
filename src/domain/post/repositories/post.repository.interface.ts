import { Identifier } from '../../shared/identifier';
import { Post } from '../entities/post.entity';

export interface FindPostQuery {
  authorId?: Identifier;
  categoryId?: Identifier;
  published?: boolean;
  skip?: number;
  take?: number;
}

export interface IPostRepository {
  save: (post: Post) => Promise<Post>;
  findById: (id: number) => Promise<Post | null>;
  delete: (id: number) => Promise<boolean>;
  find: (query: FindPostQuery) => Promise<Post[]>;
  findPublishedPosts: (skip?: number, take?: number) => Promise<Post[]>;
  findByAuthorId: (authorId: number) => Promise<Post | null>;
  count: (query: FindPostQuery) => Promise<number>;
}

export const POST_REPOSITORY_TOKEN = Symbol('IPostRepository');
