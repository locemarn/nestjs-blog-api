export abstract class CategoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific exceptions
export class ArgumentInvalidException extends CategoryException {}
export class ArgumentNotProvidedException extends CategoryException {}
export class ArgumentOutOfRangeException extends CategoryException {}

export class CategoryNotFoundException extends CategoryException {
  constructor(criteria: string) {
    super(`Category not found matching criteria: ${criteria}`);
  }
}

export class CategoryNameAlreadyExistsException extends CategoryException {
  constructor(name: string) {
    super(`Category with name "${name}" already exists.`);
  }
}
