import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  IsBoolean,
  IsNumber,
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

  @Field(() => [ID], {
    nullable: true,
    description: 'Replaces all existing categories with this list',
  })
  @IsOptional()
  @IsArray()
  @IsNumber()
  categoryIds?: (number | string)[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
