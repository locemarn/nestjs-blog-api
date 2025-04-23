/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, it } from 'vitest';
import { Category, CategoryProps } from './category.entity';
import { CategoryName } from '../value-objects/category-name.vo';
import { CategoryCreatedEvent } from '../events/category-created.event';
import { Identifier } from 'src/domain/shared/identifier';
import { CategoryUpdatedEvent } from '../events/category-updated.event';

describe('Category Entity', () => {
  let validProps: CategoryProps;

  beforeEach(() => {
    validProps = {
      name: CategoryName.create('Category 1'),
    };
  });

  it('should create a new category', () => {
    const category = Category.create(validProps);
    expect(category).toBeInstanceOf(Category);
    expect(category.id.Value).toBe(0);
    expect(category.name.Value).toBe('Category 1');
    expect(category.domainEvents).toHaveLength(1);
    expect(category.domainEvents[0]).toBeInstanceOf(CategoryCreatedEvent);
    expect((category.domainEvents[0] as CategoryCreatedEvent).name).toBe(
      'Category 1',
    );
  });

  it('should create a category with a specific ID', () => {
    const categoryId = Identifier.create(50);
    const category = Category.create(validProps, categoryId);

    expect(category.id.equals(categoryId)).toBeTruthy();
    expect(category.domainEvents).toHaveLength(0);
  });

  it('should a throw if name is not provide', () => {
    const props = { name: null as any };
    expect(() => Category.create(props)).toThrow('Category name is required');
  });

  it('should allow update the name', () => {
    const category = Category.create(validProps, Identifier.create(1));
    const oldName = category.name;
    const newName = CategoryName.create('Software Development');
    category.updateName(newName);

    expect(category.name.equals(newName)).toBeTruthy();
    expect(category.domainEvents).toHaveLength(1);
    expect(category.domainEvents[0]).toBeInstanceOf(CategoryUpdatedEvent);
    const event = category.domainEvents[0] as CategoryUpdatedEvent;
    expect(event.newName).toBe(newName.Value);
    expect(event.oldName).toBe(oldName.Value);
  });

  it('should throw when updating name to an invalid value', () => {
    const category = Category.create(validProps, Identifier.create(1));
    expect(() =>
      category.updateName(CategoryName.create('a'.repeat(30))),
    ).toThrow('Category name must be between 2 and 20 characters.');
  });

  it('should not add update event if name is unchanged', () => {
    const category = Category.create(validProps, Identifier.create(1));
    category.clearEvents();

    category.updateName(validProps.name);

    expect(category.domainEvents.length).toBe(0);
  });
});
