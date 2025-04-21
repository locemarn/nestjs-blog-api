import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UnpublishPostCommand } from './unpublish-post.command';
import { UnpublishPostOutputDto } from './unpublish-post.dto';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';

@CommandHandler(UnpublishPostCommand)
export class UnpublishPostCommandHandler
  implements ICommandHandler<UnpublishPostCommand, UnpublishPostOutputDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
    // @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {
    console.log('eventBus --->', eventBus);
    console.log('queryBus', queryBus);
  }

  async execute(
    command: UnpublishPostCommand,
  ): Promise<UnpublishPostOutputDto> {
    const postId = Identifier.create(command.postId);

    // 1. Fetch Domain Entity
    const post = await this.postRepository.findById(postId.Value as number);
    if (!post) {
      throw new PostNotFoundException(`ID: ${command.postId}`);
    }

    // Store initial published state to check if change occurs
    const wasInitiallyPublished = post.isPublished;

    // 2. Execute Domain Logic
    // post.unpublish() handles checking if already unpublished (and does nothing in that case)
    // and adds PostUnpublishedEvent if state changes.
    post.unpublish();

    // 3. Persist Changes ONLY if state actually changed
    let savedPost = post; // Start with current entity state
    if (wasInitiallyPublished && !post.isPublished) {
      // Check if state flipped
      savedPost = await this.postRepository.save(post);
      // 4. Publish Domain Events only if saved
      await savedPost.publishEvents(this.eventBus);
    } else {
      // If state didn't change, clear any potentially added (but unwanted) events
      post.clearEvents();
    }

    // 5. Return DTO (fetch via QueryBus)
    const resultDto = await this.queryBus.execute<
      GetPostByIdQuery,
      PostOutputDto | null
    >(new GetPostByIdQuery(savedPost.id.Value as number));
    if (!resultDto) {
      throw new Error(
        `Failed to fetch post with ID: ${savedPost.id.Value} after unpublish attempt.`,
      );
    }
    return resultDto;
  }
}
