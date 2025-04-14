import { CreateUserInputDto } from './create-user.dto';

export class CreateUserCommand {
  constructor(public readonly input: CreateUserInputDto) {}
}
