import { Args, Query, Resolver } from '@nestjs/graphql';
import { PostType } from './dto/types/post.type';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PostIdArgs } from './dto/args/post-id.args';
import { PostOutputDto } from 'src/application/post/queries/get-post-by-id/get-post-by-id.dto';
import { GetPostByIdQuery } from 'src/application/post/queries/get-post-by-id/get-post-by-id.query';

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
}
