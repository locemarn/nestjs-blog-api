import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import { ArgumentNotProvidedException } from 'src/domain/exceptions/domain.exceptions';
import { CategoryName } from '../value-objects/category-name.vo';
import { CategoryCreatedEvent } from '../events/category-created.event';
import { CategoryUpdatedEvent } from '../events/category-updated.event';

export interface CategoryProps {
  name: CategoryName;
}

export class Category extends BaseEntity<CategoryProps> {
  private constructor(props: CategoryProps, id?: Identifier) {
    super(props, id);
  }

  /**
   * Factory method to create a new Category entity instance.
   * @param props Properties for the category (must include name).
   * @param id Optional existing ID (if reconstructing from persistence).
   * @returns A new Category instance.
   */
  public static create(props: CategoryProps, id?: Identifier): Category {
    this.validateProps(props);
    const categoryProps: CategoryProps = {
      ...props,
    };

    const category = new Category(categoryProps, id);

    if (!id || id.Value === 0) {
      category.addDomainEvent(
        new CategoryCreatedEvent(category.id, category.name.Value),
      );
    }
    return category;
  }

  // --- Getters for safe access ---
  get name(): CategoryName {
    return this._props.name;
  }

  // --- Business Logic Methods ---

  /**
   * Updates the name of the category.
   * @param newName The new CategoryName value object.
   */
  public updateName(newName: CategoryName): void {
    if (!this._props.name.equals(newName)) {
      const oldName = this._props.name.Value;
      this._props.name = newName;
      this.addDomainEvent(
        new CategoryUpdatedEvent(this.id, newName.Value, oldName),
      );
    }
  }

  // --- Validation ---
  private static validateProps(props: CategoryProps): void {
    if (!props.name)
      throw new ArgumentNotProvidedException('Category name is required');

    if (props.name.Value.length < 3)
      throw new ArgumentNotProvidedException('Category name is required');

    if (props.name.Value.length > 20)
      throw new ArgumentNotProvidedException(
        'Category name lenght is too long',
      );
  }
}
