import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PostType } from './dto/types/post.type';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PostIdArgs } from './dto/args/post-id.args';
import { PostOutputDto } from 'src/application/post/queries/get-post-by-id/get-post-by-id.dto';
import { GetPostByIdQuery } from 'src/application/post/queries/get-post-by-id/get-post-by-id.query';
import { GetPostsArgs } from './dto/args/get-posts.args';
import { GetPostsOutputDto } from 'src/application/post/queries/get-posts/get-posts.dto';
import { GetPostsQuery } from 'src/application/post/queries/get-posts/get-posts.query';
import { DeletePostCommand } from 'src/application/post/commands/delete-post/delete-post.command';
import { DeletePostOutputDto } from 'src/application/post/commands/delete-post/delete-post.dto';
import { PublishPostCommand } from 'src/application/post/commands/publish-post/publish-post.command';
import { UnpublishPostCommand } from 'src/application/post/commands/unpublish-post/unpublish-post.command';
import { DeletePostPayload } from './dto/types/delete-post.payload';
import { CreatePostInput } from './dto/inputs/create-post.input';
import { CreatePostCommand } from 'src/application/post/commands/create-post/create-post.command';

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

  // --- Mutations ---

  // @Mutation(() => PostType, { description: 'Create a new post.' })
  // // TODO: Add @UseGuards(JwtAuthGuard) later for authentication
  // async createPost(
  //   @Args('input') input: CreatePostInput,
  //   // TODO: Get authorId from context: @CurrentUser() user: AuthenticatedUser
  // ): Promise<PostOutputDto> {
  //   // Return type matches Application Handler
  //   this.logger.log(
  //     `GraphQL: Received createPost mutation for Title: ${input.title}`,
  //   );
  //   // In a real app, get authorId from authenticated user context, not input
  //   // const authorId = user.id;
  //   const command = new CreatePostCommand({
  //     ...input,
  //     // authorId: authorId // Override input authorId with authenticated user ID
  //   });
  //   // Command handler returns the created PostOutputDto (after fetching it)
  //   return this.commandBus.execute(command);
  // }

  @Mutation(() => PostType, { description: 'Publish a draft post.' })
  // TODO: Add @UseGuards(JwtAuthGuard) and potentially author/admin checks
  async publishPost(
    @Args() args: PostIdArgs, // Use ArgsType for ID
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
  // TODO: Add @UseGuards(JwtAuthGuard) and potentially author/admin checks
  async unpublishPost(
    @Args() args: PostIdArgs, // Use ArgsType for ID
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
  // TODO: Add @UseGuards(JwtAuthGuard) and potentially author/admin checks
  async deletePost(
    @Args() args: PostIdArgs, // Use ArgsType for ID
  ): Promise<DeletePostOutputDto> {
    // Return type matches Application Handler
    this.logger.log(`GraphQL: Received deletePost mutation for ID: ${args.id}`);
    const command = new DeletePostCommand(args.id);
    // Command handler returns { success: boolean } which matches DeletePostPayload
    return this.commandBus.execute(command);
  }
}
