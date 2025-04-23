import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ArgsType()
export class CategoryIdArgs {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Category ID cannot be empty' })
  @IsNumber()
  id: number;
}
