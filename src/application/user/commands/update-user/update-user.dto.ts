import { Role } from 'src/domain/user/entities/user.entity';
import { UserOutputDto } from '../../queries/get-user-by-id/get-user-by-id.dto';

export class UpdateUserInputDto {
  username?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export type UpdateUserOutputDto = UserOutputDto;
