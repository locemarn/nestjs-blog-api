import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DeletePostPayload {
  @Field()
  success: boolean;
}
