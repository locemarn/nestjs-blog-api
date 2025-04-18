import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CreatePostCommand } from './create-post.command';
import { CreatePostOutputDto } from './create-post.dto';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../../domain/post/repositories/post.repository.interface';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../../domain/user/repositories/user.repository.interface';
import { PostMapper } from '../../mappers/post.mapper';
import { Identifier } from '../../../../domain/shared/identifier';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';
import { PostTitleVo } from '../../../../domain/post/value-objects/post-title.vo';
import { PostContentVo } from '../../../../domain/post/value-objects/post-content.vo';
import { Post } from '../../../../domain/post/entities/post.entity';
import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';
import { GetPostByIdQuery } from '../../queries/get-post-by-id/get-post-by-id.query';

@CommandHandler(CreatePostCommand)
export class CreatePostCommandHandler
  implements ICommandHandler<CreatePostCommand, CreatePostOutputDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    // private readonly eventBus: EventBus,
    // private readonly queryBus: QueryBus,
    @Inject('EventBus') // Use the literal string 'QueryBus'
    private readonly eventBus: EventBus,
    @Inject('QueryBus') // Use the literal string 'QueryBus'
    private readonly queryBus: QueryBus,
    private readonly postMapper: PostMapper,
  ) {}

  async execute(command: CreatePostCommand): Promise<CreatePostOutputDto> {
    const {
      title,
      content,
      published = false,
      categoryIds = [],
      authorId,
    } = command.input;

    // 1. Validate Author Exists (Application Rule)
    const authorIdentifier = Identifier.create(authorId);
    const author = await this.userRepo.findById(authorIdentifier);
    if (!author) {
      throw new UserNotFoundException(`Author with ID ${authorId} not found.`);
    }

    // 2. Create Domain Value Objects & Identifiers
    const postTitle = PostTitleVo.create(title);
    const postContent = PostContentVo.create(content);
    const categoryIdentifiers = categoryIds.map((categoryId) =>
      Identifier.create(categoryId),
    );

    // 3. Create Domain Entity
    const post = Post.create({
      title: postTitle,
      content: postContent,
      userId: authorIdentifier,
      categoryIds: categoryIdentifiers,
      published: published,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Persist using Repository
    const savedPost = await this.postRepository.save(post);

    // 5. Publish Domain Events
    await savedPost.publishEvents(this.eventBus);

    // 6 . Map to Output DTO
    const resultDto = await this.queryBus.execute<
      GetPostByIdQuery,
      PostOutputDto | null
    >(new GetPostByIdQuery(savedPost.id.Value as number));

    if (!resultDto) {
      throw new Error(
        `Failed to fetch newly created post with ID: ${savedPost.id.Value}.`,
      );
    }
    return resultDto;
  }
}
