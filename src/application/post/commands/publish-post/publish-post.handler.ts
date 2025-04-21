import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { PublishPostCommand } from './publish-post.command';
import { PublishPostOutputDto } from './publish-post.dto';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';

@CommandHandler(PublishPostCommand)
export class PublishPostCommandHandler
  implements ICommandHandler<PublishPostCommand, PublishPostOutputDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
    // @Inject('QueryBus')
    private readonly queryBus: QueryBus,
  ) {}
  async execute(command: PublishPostCommand): Promise<PublishPostOutputDto> {
    const postId = Identifier.create(command.postId);

    const post = await this.postRepository.findById(+postId.Value);
    if (!post) {
      throw new PostNotFoundException(`Post with id ${postId.Value} not found`);
    }

    post.publish();

    const savedPost = await this.postRepository.save(post);
    await savedPost.publishEvents(this.eventBus);
    const resultDto = await this.queryBus.execute<
      GetPostByIdQuery,
      PostOutputDto | null
    >(new GetPostByIdQuery(postId.Value as number));

    if (!resultDto) {
      throw new Error(
        `Failed to fetch published post with ID: ${savedPost.id.Value}.`,
      );
    }

    return resultDto;
  }
}
