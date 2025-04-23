import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@InputType({ description: 'Data for updating an existing category name' })
export class UpdateCategoryInput {
  // Name is required for update action, but structure matches input DTO
  @Field({ description: 'The new unique name for the category' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  @IsString()
  @Length(2, 20, {
    message: 'Category name must be between 2 and 20 characters',
  })
  name: string;
}
