import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@InputType({ description: 'Data required to create a new category' })
export class CreateCategoryInput {
  @Field({ description: 'Name for the new category (must be unique)' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  @IsString()
  @Length(2, 20, {
    message: 'Category name must be between 2 and 20 characters',
  })
  name: string;
}
