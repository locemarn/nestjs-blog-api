import { CommentResponseOutputDto } from './comment-response.output.dto';

export class CommentOutputDto {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  created_at: Date;
  updated_at: Date;
  replies: CommentResponseOutputDto[]; // Array of reply DTOs
  // Optional: Add author username/details later
}
