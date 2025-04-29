export class CommentResponseOutputDto {
  id: number;
  content: string;
  authorId: number;
  commentId: number;
  postId: number;
  created_at: Date;
  updated_at: Date;
}
