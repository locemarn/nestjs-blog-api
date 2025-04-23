import { ApplicationException } from 'src/application/user/shared/exceptions/application.exception';

export class CategoryApplicationException extends ApplicationException {}

export class AppCategoryNameAlreadyExistsException extends CategoryApplicationException {
  constructor(name: string) {
    super(`Category name "${name}" is already in use.`);
  }
}

export class CategoryInUseException extends CategoryApplicationException {
  constructor(categoryId: string | number) {
    super(
      `Category ID ${categoryId} cannot be deleted as it is currently associated with posts.`,
    );
  }
}
