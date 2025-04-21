import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ArgsType()
export class PostIdArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
