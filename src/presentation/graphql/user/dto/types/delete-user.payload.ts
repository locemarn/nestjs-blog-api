import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DeleteUserPayload {
  @Field()
  success: boolean;
}
