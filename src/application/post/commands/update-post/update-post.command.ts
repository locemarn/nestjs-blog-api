import { UpdatePostInputDto } from './update-post.dto';

export class UpdatePostCommand {
  constructor(
    public readonly postId: number,
    public readonly input: UpdatePostInputDto,
  ) {}
}
