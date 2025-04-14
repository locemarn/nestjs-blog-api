import { UserApplicationException } from './user-app.exception';

export class UsernameAlreadyExistsException extends UserApplicationException {
  constructor(username: string) {
    super(`User with username "${username}" already exists.`);
  }
}
