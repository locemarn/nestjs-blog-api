import { CreateCommentInputDto } from './create-comment.dto';

export class CreateCommentCommand {
  constructor(public readonly input: CreateCommentInputDto) {}
}
