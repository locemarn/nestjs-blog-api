import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import {
  POST_REPOSITORY_TOKEN,
  IPostRepository,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { PostOutputDto } from './get-post-by-id.dto';
import { GetPostByIdQuery } from './get-post-by-id.query';

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdQueryHandler
  implements IQueryHandler<GetPostByIdQuery, PostOutputDto | null>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(POST_MAPPER_TOKEN)
    private readonly postMapper: PostMapper,
  ) {}

  async execute(query: GetPostByIdQuery): Promise<PostOutputDto | null> {
    console.log('query --->', query);
    const postId = Identifier.create(query.postId);
    console.log('postId --->', postId);
    const post = await this.postRepository.findById(postId.Value as number);
    console.log('post --->', post);

    if (!post) {
      throw new PostNotFoundException(`ID: ${query.postId}`);
    }

    return this.postMapper.toDto(post);
  }
}
