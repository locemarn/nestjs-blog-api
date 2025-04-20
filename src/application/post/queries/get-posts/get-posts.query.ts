import { GetPostsInputDto } from './get-posts.dto';

export class GetPostsQuery {
  constructor(public readonly options?: GetPostsInputDto) {} // Options are optional
}
