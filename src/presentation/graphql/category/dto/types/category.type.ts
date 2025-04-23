import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PostType } from 'src/presentation/graphql/post/dto/types/post.type';

@ObjectType('Category')
export class CategoryType {
  @Field(() => ID, { description: 'Unique identifier for the category' })
  id: number;

  @Field({ description: 'Unique name of the category' })
  name: string;

  @Field(() => [PostType], {
    nullable: 'itemsAndList',
    description: 'Posts associated with this category',
  })
  posts?: PostType[];
}
