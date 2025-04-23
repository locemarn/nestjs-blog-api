import { UpdateCategoryInputDto } from './update-category.dto';

export class UpdateCategoryCommand {
  constructor(
    public readonly categoryId: number,
    public readonly input: UpdateCategoryInputDto,
  ) {}
}
