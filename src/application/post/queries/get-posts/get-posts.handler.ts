import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQuery } from './get-posts.query';
import { GetPostsInputDto, GetPostsOutputDto } from './get-posts.dto';
import {
  FindPostQuery,
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { Identifier } from 'src/domain/shared/identifier';
import { Inject } from '@nestjs/common';

@QueryHandler(GetPostsQuery)
export class GetPostsQueryHandler
  implements IQueryHandler<GetPostsQuery, GetPostsOutputDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(POST_MAPPER_TOKEN)
    private readonly postMapper: PostMapper,
  ) {}

  async execute(query: GetPostsQuery): Promise<GetPostsOutputDto> {
    const options: GetPostsInputDto = {
      skip: 0,
      take: 10,
      ...query.options,
    };

    const repoQuery: FindPostQuery = {
      published: options.published,
      authorId: options.authorId
        ? Identifier.create(options.authorId)
        : undefined,
      categoryId: options.categoryId
        ? Identifier.create(options.categoryId)
        : undefined,
      skip: options.skip,
      take: options.take,
    };

    const posts = await this.postRepository.find(repoQuery);

    const countQuery: FindPostQuery = {
      ...repoQuery,
      skip: undefined,
      take: undefined,
    };
    let total = 0;
    if (typeof this.postRepository.count === 'function') {
      total = await this.postRepository.count(countQuery);
    } else {
      console.warn(
        "IPostRepository does not have a 'count' method. Total count might be inaccurate.",
      );
      total = posts.length;
    }

    // --- Ensure this.postMapper is defined before calling ---
    if (!this.postMapper) {
      console.error('!!! PostMapper was not injected correctly !!!');
      throw new Error('Internal Server Error: Mapper not available');
    }

    const postDtos = this.postMapper.toDtos(posts);
    const hasMore = options.skip || 0 + (options.take || 0) < total;
    // const result = new GetPostsOutputDto();
    return {
      posts: postDtos,
      total: total,
      skip: options.skip || 0,
      take: options.take || 10,
      hasMore: !!hasMore,
    };
  }
}
