export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific exceptions
export class ArgumentInvalidException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
export class ArgumentNotProvidedException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
export class ArgumentOutOfRangeException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
export class UserNotFoundException extends DomainException {
  constructor(criteria: string) {
    super(`User not found matching criteria: ${criteria}`);
  }
}
