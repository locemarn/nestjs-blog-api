export class PostOutputDto {
  id: number;
  title: string;
  content: string;
  published: boolean;
  authorId: number;
  categoryIds: number[];
  created_at: Date;
  updated_at: Date;
  // Optional: Add author username/email if needed, requires population/join
  // authorUsername?: string;
}
