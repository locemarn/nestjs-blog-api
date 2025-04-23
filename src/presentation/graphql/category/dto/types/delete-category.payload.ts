import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DeleteCategoryPayload {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
