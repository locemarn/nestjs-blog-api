import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Post')
export class PostType {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  published: boolean;

  @Field(() => ID)
  authorId: number;

  @Field(() => [ID])
  cateforyIds: number[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
