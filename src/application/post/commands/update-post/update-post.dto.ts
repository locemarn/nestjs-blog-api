import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';

export class UpdatePostInputDto {
  readonly title?: string;
  readonly content?: string;
  readonly publish?: boolean;
  readonly categoryIds?: number[];
}

export type UpdatePostOutputDto = PostOutputDto;
