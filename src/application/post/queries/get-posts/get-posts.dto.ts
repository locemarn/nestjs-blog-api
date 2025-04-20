import { PostOutputDto } from '../get-post-by-id/get-post-by-id.dto';

export class GetPostsInputDto {
  // Filter
  readonly authorId?: number;
  readonly categoryId?: number;
  readonly published?: boolean;

  // Pagination
  readonly skip?: number;
  readonly take?: number;
}

export class GetPostsOutputDto {
  readonly posts: PostOutputDto[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
  readonly hasMore: boolean;
}
