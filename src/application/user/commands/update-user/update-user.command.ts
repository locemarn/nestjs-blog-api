import { UpdateUserInputDto } from './update-user.dto';

export class UpdateUserCommand {
  constructor(
    public readonly userId: number | string, // ID of user to update
    public readonly data: UpdateUserInputDto, // Data to update with
  ) {}
}
