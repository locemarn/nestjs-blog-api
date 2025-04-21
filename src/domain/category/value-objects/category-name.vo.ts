import {
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException,
} from 'src/domain/exceptions/domain.exceptions';

const MIN_LENGTH = 2;
const MAX_LENGTH = 50;

export class CategoryName {
  private constructor(private readonly value: string) {
    this.validate();
  }

  get Value(): string {
    return this.value;
  }

  /**
   * Creates a new CategoryName value object.
   * @param name The category name string.
   * @returns A new CategoryName instance.
   * @throws ArgumentNotProvidedException If name is null, undefined, or empty/whitespace.
   * @throws ArgumentOutOfRangeException If name length is outside defined bounds.
   */
  static create(name: string): CategoryName {
    const trimmedName = name ? name.trim() : '';
    return new CategoryName(trimmedName);
  }

  private validate(): void {
    if (
      this.value === null ||
      this.value === undefined ||
      this.value.length === 0
    ) {
      throw new ArgumentNotProvidedException('Category name cannot be empty.');
    }
    if (this.value.length < MIN_LENGTH || this.value.length > MAX_LENGTH) {
      throw new ArgumentOutOfRangeException(
        `Category name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
      );
    }
    // Add other potential validations? (e.g., allowed characters?)
  }

  equals(other?: CategoryName): boolean {
    return other instanceof CategoryName && this.value === other.Value;
  }
}
