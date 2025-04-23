import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  IsBoolean,
  IsInt,
} from 'class-validator';

@InputType()
export class UpdatePostInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => [Int], {
    nullable: true,
    description: 'Replaces all existing categories with this list',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
