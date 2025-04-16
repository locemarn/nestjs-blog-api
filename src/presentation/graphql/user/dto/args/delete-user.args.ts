import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class DeleteUserArgs {
  @Field(() => ID)
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  id: number;
}
