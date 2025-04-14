import { Role } from 'src/domain/user/entities/user.entity';

export class UserOutputDto {
  readonly id: number; // Match your Identifier's underlying type
  readonly email: string;
  readonly username: string;
  readonly role: Role;
  readonly created_at: Date;
  readonly updated_at: Date;
  // Add any other publicly safe fields you might want later (e.g., postCount)
}
