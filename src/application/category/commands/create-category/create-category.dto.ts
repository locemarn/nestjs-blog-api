import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';

export class CreateCategoryInputDto {
  readonly name: string;
}
// Return the created category DTO
export type CreateCategoryOutputDto = CategoryOutputDto;
