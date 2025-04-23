import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthenticatedUser,
  Roles,
} from 'src/auth/decorators/current-user.decorator';

// GraphQL DTOs
import { PostType } from './dto/types/post.type';
import { PostIdArgs } from './dto/args/post-id.args';
import { GetPostsArgs } from './dto/args/get-posts.args';
import { DeletePostPayload } from './dto/types/delete-post.payload';
import { CreatePostInput } from './dto/inputs/create-post.input';

// Application Commands/Queries
import { DeletePostCommand } from 'src/application/post/commands/delete-post/delete-post.command';
import { PublishPostCommand } from 'src/application/post/commands/publish-post/publish-post.command';
import { UnpublishPostCommand } from 'src/application/post/commands/unpublish-post/unpublish-post.command';
import { UpdatePostCommand } from 'src/application/post/commands/update-post/update-post.command';
import { CreatePostCommand } from 'src/application/post/commands/create-post/create-post.command';
import { GetPostByIdQuery } from 'src/application/post/queries/get-post-by-id/get-post-by-id.query';
import { GetPostsQuery } from 'src/application/post/queries/get-posts/get-posts.query';

// Application Output DTOs
import { PostOutputDto } from 'src/application/post/queries/get-post-by-id/get-post-by-id.dto';
import { GetPostsOutputDto } from 'src/application/post/queries/get-posts/get-posts.dto';
import { DeletePostOutputDto } from 'src/application/post/commands/delete-post/delete-post.dto';
import { UpdatePostInput } from './dto/inputs/update-post.input';
import { Role } from 'src/domain/user/entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Resolver(() => PostType)
export class PostResolver {
  private readonly logger = new Logger(PostResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --- Queries ---
  @Query(() => PostType, { name: 'postById', nullable: true })
  async getPostById(@Args() args: PostIdArgs): Promise<PostOutputDto | null> {
    this.logger.log(`Executing postById query for ID: ${args.id}`);
    return this.queryBus.execute(new GetPostByIdQuery(args.id));
  }

  @Query(() => GetPostsOutputDto, {
    name: 'posts',
    description: 'Fetch a list of posts with optional filters and pagination.',
  })
  async getPosts(@Args() args: GetPostsArgs): Promise<GetPostsOutputDto> {
    this.logger.log(
      `GraphQL: Received posts query with options: ${JSON.stringify(args)}`,
    );
    return this.queryBus.execute(new GetPostsQuery(args));
  }

  // --- Mutations (Protected by Role) ---

  @Mutation(() => PostType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createPost(
    @Args('input') input: CreatePostInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostOutputDto> {
    this.logger.log(
      `GraphQL: Received createPost mutation from User ID: ${user.userId}`,
    );
    if (!user) {
      // Should be caught by JwtAuthGuard, but double-check
      throw new UnauthorizedException(
        'Cannot create post without authentication.',
      );
    }
    const command = new CreatePostCommand({
      ...input,
      authorId: user.userId,
      categoryIds: input.categoryIds?.map((id) =>
        typeof id === 'string' ? parseInt(id, 10) : id,
      ),
    });
    return this.commandBus.execute(command);
  }

  @Mutation(() => PostType, { description: 'Update an existing post.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updatePost(
    @Args('id', { type: () => ID }) id: number,
    @Args('input') input: UpdatePostInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostOutputDto> {
    console.log('input --->', input);
    this.logger.log(
      `GraphQL: Received updatePost mutation for ID: ${id} by User ID: ${user?.userId}`,
    );
    // Authorization check would go here (e.g., fetch post, check if user.userId === post.authorId)
    // For now, just execute the command
    const command = new UpdatePostCommand(+id, input);
    return this.commandBus.execute(command);
  }

  @Mutation(() => PostType, { description: 'Publish a draft post.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async publishPost(
    @Args() args: PostIdArgs,
    // @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostOutputDto> {
    // Return type matches Application Handler
    this.logger.log(
      `GraphQL: Received publishPost mutation for ID: ${args.id}`,
    );
    const command = new PublishPostCommand(args.id);
    // Command handler returns the updated PostOutputDto
    return this.commandBus.execute(command);
  }

  @Mutation(() => PostType, {
    description: 'Unpublish a post, making it a draft.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async unpublishPost(
    @Args() args: PostIdArgs,
    // @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostOutputDto> {
    // Return type matches Application Handler
    this.logger.log(
      `GraphQL: Received unpublishPost mutation for ID: ${args.id}`,
    );
    const command = new UnpublishPostCommand(args.id);
    // Command handler returns the updated PostOutputDto
    return this.commandBus.execute(command);
  }

  @Mutation(() => DeletePostPayload, { description: 'Delete a post by ID.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deletePost(
    @Args() args: PostIdArgs,
    // @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeletePostOutputDto> {
    // Return type matches Application Handler
    this.logger.log(`GraphQL: Received deletePost mutation for ID: ${args.id}`);
    const command = new DeletePostCommand(args.id);
    // Command handler returns { success: boolean } which matches DeletePostPayload
    return this.commandBus.execute(command);
  }
}
