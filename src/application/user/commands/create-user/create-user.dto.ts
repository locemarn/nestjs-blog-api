import { Identifier } from 'src/domain/shared/identifier';
import { Role } from 'src/domain/user/entities/user.entity';

export class CreateUserInputDto {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly role: Role = Role.USER;
}

export class CreateUserOutputDto {
  readonly id: Identifier;
  // readonly email: string;
  // readonly username: string;
  // readonly password: string;
  // readonly role: Role = Role.USER;
  // readonly created_at = Date;
  // readonly updated_at = Date;
}
