import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role, User, UserProps } from './user.entity';
import { Identifier } from 'src/domain/shared/identifier';

describe('User Entity', () => {
  let minimalValueProps: UserProps;

  beforeEach(() => {
    minimalValueProps = {
      email: 'test@email.com',
      username: 'testuser',
      password: 'hashed_password',
      role: Role.USER,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  it('should create a user with minimal properties', () => {
    const user = User.create(minimalValueProps);
    expect(user).toBeInstanceOf(User);
    expect(user.id.Value).toBe(0);
    expect(user.email).toBe(minimalValueProps.email);
    expect(user.username).toBe(minimalValueProps.username);
    expect(user.role).toBe(minimalValueProps.role);
    expect(user.createdAt).toEqual(minimalValueProps.created_at);
    expect(user.updatedAt).toEqual(minimalValueProps.updated_at);
  });

  it('should create a user with a specific ID', () => {
    const id = Identifier.create(1);
    const user = User.create(minimalValueProps, id);
    expect(user).toBeInstanceOf(User);
    expect(user.id).toEqual(id);
  });

  // --- Business Logic Tests ---
  it('should allow updating the username', () => {
    const user = User.create(minimalValueProps);
    const newUsername = 'newusername';
    user.updateUsername(newUsername);
    expect(user.username).toBe(newUsername);
  });

  it('should throw an error when updating the username to an invalid value (e.g., empty)', () => {
    const user = User.create(minimalValueProps);
    expect(() => user.updateUsername('')).toThrow('New username is required');
  });

  it('should allow updating the password', () => {
    const user = User.create(minimalValueProps);
    vi.useFakeTimers();
    vi.advanceTimersByTime(100);
    const newPassword = 'new_hashed_password';
    user.changePassword(newPassword);
    expect(user._props.password).toBe(newPassword);
    expect(user._props.updated_at).not.toEqual(minimalValueProps.updated_at);
  });

  it('should check if user is an admin', () => {
    const user = User.create(minimalValueProps);
    const adminUser = User.create({ ...minimalValueProps, role: Role.ADMIN });

    expect(user.isAdmin()).toBeFalsy();
    expect(adminUser.isAdmin()).toBeTruthy();
  });

  it('should promote user role from USER to ADMIN', () => {
    const user = User.create(minimalValueProps);
    expect(user.role).toBe(Role.USER);
    user.promoteToAdmin();
    expect(user.role).toBe(Role.ADMIN);
  });

  it('should demote user role from ADMIN to USER', () => {
    const user = User.create({ ...minimalValueProps, role: Role.ADMIN });
    expect(user.role).toBe(Role.ADMIN);
    user.demoteToUser();
    expect(user.role).toBe(Role.USER);
  });
});
