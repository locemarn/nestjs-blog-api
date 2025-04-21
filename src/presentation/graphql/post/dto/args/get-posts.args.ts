import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, IsBoolean, IsInt, Min, IsNumber } from 'class-validator';

@ArgsType()
export class GetPostsArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsNumber()
  authorId?: number | string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsNumber()
  categoryId?: number | string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number = 10;

  // Add sorting args here if needed
}
