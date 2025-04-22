import { CategoryOutputDto } from '../../queries/get-category-by-id/get-category-by-id.dto';

export class UpdateCategoryInputDto {
  readonly name: string;
}

export type UpdateCategoryOutputDto = CategoryOutputDto;
