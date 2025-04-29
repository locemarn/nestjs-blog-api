export class CreateCommentInputDto {
  readonly content: string;
  readonly authorId: number;
  readonly postId: number;
}

export type CreateCommentOutputDto = CreateCommentInputDto;
