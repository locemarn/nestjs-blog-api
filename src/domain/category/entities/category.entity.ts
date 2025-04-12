import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';

export interface CategoryProps {
  name: string;
}

export class Category extends BaseEntity<CategoryProps> {
  private constructor(props: CategoryProps, id?: Identifier) {
    super(props, id);
  }

  public static create(props: CategoryProps, id?: Identifier): Category {
    this.validateProps(props);
    const categoryProps: CategoryProps = {
      ...props,
    };

    const category = new Category(categoryProps, id);
    return category;
  }

  // --- Getters for safe access ---
  get name(): string {
    return this._props.name;
  }

  // --- Business Logic Methods ---
  public updateName(newName: string): void {
    if (!newName || newName.length < 3)
      throw new ArgumentNotProvidedException('Category name is required');

    if (newName.length > 50)
      throw new ArgumentNotProvidedException(
        'Category name length is too long',
      );
    this._props.name = newName;
  }

  // --- Validation ---
  private static validateProps(props: CategoryProps): void {
    if (!props.name)
      throw new ArgumentNotProvidedException('Category name is required');

    if (props.name.length < 3)
      throw new ArgumentNotProvidedException('Category name is required');

    if (props.name.length > 50)
      throw new ArgumentNotProvidedException(
        'Category name lenght is too long',
      );
  }
}
