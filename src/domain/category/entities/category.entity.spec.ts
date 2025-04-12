import { beforeEach, describe, expect, it } from 'vitest';
import { Category, CategoryProps } from './category.entity';

describe('Category Entity', () => {
  let minimalValueProps: CategoryProps;

  beforeEach(() => {
    minimalValueProps = {
      name: 'Category 1',
    };
  });

  it('should create a new category', () => {
    const category = Category.create(minimalValueProps);
    expect(category).toBeInstanceOf(Category);
  });

  it('should throw an error if category name is not provide or has less then 3 chars', () => {
    expect(() =>
      Category.create({
        ...minimalValueProps,
        name: null as unknown as string,
      }),
    ).toThrow('Category name is required');

    expect(() =>
      Category.create({
        ...minimalValueProps,
        name: '',
      }),
    ).toThrow('Category name is required');
  });

  it('should throw an error if the lenght of category name is more than 50', () => {
    expect(() =>
      Category.create({
        ...minimalValueProps,
        name: 'a'.repeat(51),
      }),
    ).toThrow('Category name lenght is too long');
  });

  it('should update category name', () => {
    const category = Category.create(minimalValueProps);
    category.updateName('updated category');
    expect(category.name).not.toEqual(minimalValueProps.name);
    expect(category.name).toBe('updated category');
  });

  it('should throw an error if update category name is empty or value has less than 3 chars', () => {
    const category = Category.create(minimalValueProps);

    expect(() => category.updateName(null as unknown as string)).toThrow(
      'Category name is required',
    );

    expect(() => category.updateName(null as unknown as string)).toThrow(
      'Category name is required',
    );
  });

  it('should throw an error if update category name value has more than 50 chars', () => {
    const category = Category.create(minimalValueProps);
    expect(() => category.updateName('a'.repeat(51))).toThrow(
      'Category name length is too long',
    );
  });
});
