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
  findById: (id: string) => Promise<Post | null>;
  delete: (id: string) => Promise<boolean>;
  find: (query: FindPostQuery) => Promise<Post[]>;
  findPublishedPosts: (skip?: number, take?: number) => Promise<Post[]>;
  findByAuthorId: (authorId: string) => Promise<Post | null>;
}

export const POST_REPOSITORY_TOKEN = Symbol('IPostRepository');
