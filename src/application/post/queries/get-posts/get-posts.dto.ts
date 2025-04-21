import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PostType } from 'src/presentation/graphql/post/dto/types/post.type';
import { PostOutputDto } from '../get-post-by-id/get-post-by-id.dto';

export class GetPostsInputDto {
  // Filter
  readonly authorId?: number;
  readonly categoryId?: number;
  readonly published?: boolean;

  // Pagination
  readonly skip?: number;
  readonly take?: number;
}

@ObjectType() // <--- Add ObjectType decorator
export class GetPostsOutputDto {
  @Field(() => [PostType]) // <--- Use the GraphQL PostType here and mark as array
  posts: PostOutputDto[]; // Keep TS type for handler return compatibility

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field()
  hasMore?: boolean;
}
