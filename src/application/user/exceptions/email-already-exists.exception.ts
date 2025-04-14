import { UserApplicationException } from './user-app.exception';

export class EmailAlreadyExistsException extends UserApplicationException {
  constructor(email: string) {
    super(`User with email "${email}" already exists.`);
  }
}
