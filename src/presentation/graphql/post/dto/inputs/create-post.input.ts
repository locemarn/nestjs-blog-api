import { Field, InputType, Int } from '@nestjs/graphql';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  // @Field(() => ID)
  // @IsNumber()
  // authorId: string;

  @Field(() => [Int], {
    nullable: true,
    description: 'Optional list of category IDs (numbers)',
  }) // Use [Int]
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0) // Ensure it's an array, even if empty
  @IsInt({ each: true, message: 'Each category ID must be an integer number' }) // Validate each element as an integer
  categoryIds?: number[]; // Type as number[]

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
