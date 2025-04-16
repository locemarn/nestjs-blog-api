import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class GetUserByIdArgs {
  @Field(() => ID)
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  id: number;
}
