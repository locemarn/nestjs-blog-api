import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentOutputDto } from './create-comment.dto';
import {
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from '../../../../domain/comment/repositories/comment.repository.interface';
import { IUserRepository } from '../../../../domain/user/repositories/user.repository.interface';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../../domain/post/repositories/post.repository.interface';
import { CommentContent } from 'src/domain/comment/value-objects/comment-content.vo';
import { UserNotFoundException } from 'src/domain/exceptions/domain.exceptions';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import { Identifier } from 'src/domain/shared/identifier';
import { Comment } from 'src/domain/comment/entities/comment.entity';
import { CommentOutputDto } from '../../queries/dto/comment.output.dto';
import { GetCommentByIdQuery } from '../../queries/get-comment-by-id/get-comment-by-id.query';

@CommandHandler(CreateCommentCommand)
export class CreateCommentCommandHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentOutputDto>
{
  constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly commentRepository: ICommentRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(EventBus)
    private readonly eventBus: EventBus,
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: CreateCommentCommand,
  ): Promise<CreateCommentOutputDto> {
    const { content, postId, authorId } = command.input;

    // 1. Validate Foreign Keys Exist (Application Rule)
    const authorIdentifier = Identifier.create(authorId);
    const postIdentifier = Identifier.create(postId);

    // Fetch concurrently for efficiency
    const [author, post] = await Promise.all([
      this.userRepository.findById(authorIdentifier),
      this.postRepository.findById(postIdentifier.Value),
    ]);

    // Check results
    if (!author) {
      throw new UserNotFoundException(`Author with ID ${authorId} not found.`);
    }
    if (!post) {
      throw new PostNotFoundException(`Post with ID ${postId} not found.`);
    }

    // 2. Create Value Objects (handles primitive validation)
    const commentContent = CommentContent.create(content);

    // 3. Create Domain Entity
    // Factory method handles internal domain validation and adds CommentCreatedEvent
    const comment = Comment.create({
      content: commentContent,
      userId: authorIdentifier,
      postId: postIdentifier,
      // timestamps handled by DB/Prisma via schema defaults usually
    });

    // 4. Persist using Repository
    // The repo's saveComment should return the persisted entity with ID
    const savedComment = await this.commentRepository.saveComment(comment);

    // 5. Publish Domain Events registered on the entity
    await savedComment.publishEvents(this.eventBus);

    // 6. Return DTO by fetching the newly created comment state via QueryBus
    const getCommentQuery = new GetCommentByIdQuery(savedComment.id.Value);
    const resultDto = await this.queryBus.execute<
      GetCommentByIdQuery,
      CommentOutputDto | null
    >(getCommentQuery);

    if (!resultDto) {
      console.error(
        `CRITICAL: Failed to fetch newly created comment with ID: ${savedComment.id.Value} immediately after saving.`,
      );
      throw new Error(
        `Failed to fetch newly created comment with ID: ${savedComment.id.Value}.`,
      );
    }

    resultDto.replies = resultDto.replies ?? [];

    return resultDto;
  }
}
