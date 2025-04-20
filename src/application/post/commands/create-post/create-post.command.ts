import { CreatePostInputDto } from './create-post.dto';

export class CreatePostCommand {
  constructor(public readonly input: CreatePostInputDto) {}
}
