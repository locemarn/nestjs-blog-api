import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdatePostOutputDto } from './update-post.dto';
import { UpdatePostCommand } from './update-post.command';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from 'src/domain/post/repositories/post.repository.interface';
import { POST_MAPPER_TOKEN, PostMapper } from '../../mappers/post.mapper';
import { Identifier } from 'src/domain/shared/identifier';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';

@CommandHandler(UpdatePostCommand)
export class UpdatePostCommandHandler
  implements ICommandHandler<UpdatePostCommand, UpdatePostOutputDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
    @Inject(POST_MAPPER_TOKEN)
    private readonly postMapper: PostMapper,
    // Optional: Inject Category Repository
    // @Inject(CATEGORY_REPOSITORY_TOKEN) private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<PostOutputDto> {
    const postId = Identifier.create(command.postId);
    const updatedData = command.input;

    const post = await this.postRepository.findById(+postId.Value);
    if (!post) {
      throw new PostNotFoundException(`Post with ID ${postId.Value} not found`);
    }

    let update = false;
    if (updatedData.title !== undefined) {
      const newTitle = PostTitleVo.create(updatedData.title);
      if (!post.title.equals(newTitle)) {
        post.updateTitle(newTitle);
        update = true;
      }
    }

    if (updatedData.content !== undefined) {
      const newContent = PostContentVo.create(updatedData.content);
      if (!post.content.equals(newContent)) {
        post.updateContent(newContent);
        update = true;
      }
    }

    if (updatedData.categoryIds !== undefined) {
      const newCategoryIdentifiers = updatedData.categoryIds.map((id) =>
        Identifier.create(id),
      );

      const currentIdsSet = new Set(post.categoryIds.map((id) => id.Value));
      const newIdsSet = new Set(newCategoryIdentifiers.map((id) => id.Value));

      if (
        currentIdsSet.size !== newIdsSet.size ||
        ![...newIdsSet].every((id) => currentIdsSet.has(id))
      ) {
        const existingIds = [...post.categoryIds];
        existingIds.forEach((identifier: Identifier) =>
          post.addCategory(identifier),
        );
        newCategoryIdentifiers.forEach((id) => post.addCategory(id));
        update = true;
      }
    }

    if (updatedData.publish !== undefined) {
      if (updatedData.publish) {
        post.publish();
      } else {
        post.unpublish();
      }
      update = true;
    }

    let savedPost = post;
    if (update) {
      savedPost = await this.postRepository.save(post);
      await savedPost.publishEvents(this.eventBus);
    } else {
      post.clearEvents();
    }

    const resultDto = await this.queryBus.execute<
      GetPostByIdQuery,
      PostOutputDto | null
    >(new GetPostByIdQuery(+savedPost.id.Value));

    if (!resultDto) {
      throw new Error(
        `Failed to fetch updated post with ID: ${savedPost.id.Value}.`,
      );
    }

    return resultDto;
  }
}
