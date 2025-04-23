import { CreateCategoryInputDto } from './create-category.dto';

export class CreateCategoryCommand {
  constructor(public readonly input: CreateCategoryInputDto) {}
}
