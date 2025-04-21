import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthPayloadDto {
  @Field()
  accessToken: string;
}
