import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
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

  @Field(() => ID)
  @IsNumber()
  authorId: string;

  @Field(() => [ID], {
    nullable: true,
    description: 'Optional list of category IDs to associate',
  })
  @IsOptional()
  @IsArray()
  @IsNumber()
  categoryIds?: (number | string)[];

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
