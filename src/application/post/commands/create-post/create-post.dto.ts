import { PostOutputDto } from '../../queries/get-post-by-id/get-post-by-id.dto';

export class CreatePostInputDto {
  readonly title: string;
  readonly content: string;
  readonly authorId: number;
  readonly categoryIds?: number[];
  readonly published?: boolean = false;
}

export type CreatePostOutputDto = PostOutputDto;
