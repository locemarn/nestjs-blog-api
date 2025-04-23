import { BaseEntity } from 'src/domain/shared/base-entity';
import { Identifier } from 'src/domain/shared/identifier';
import {
  ArgumentNotProvidedException,
  ArgumentInvalidException,
  ArgumentOutOfRangeException,
} from '../../exceptions/domain.exceptions';
import { Email } from '../value-objects/email.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  email: string;
  username: string;
  password: string;
  role: Role;
  created_at?: Date;
  updated_at?: Date;
}

export class User extends BaseEntity<UserProps> {
  private constructor(props: UserProps, id?: Identifier) {
    super(props, id);
  }

  public static create(props: UserProps, id?: Identifier): User {
    this.validateProps(props);
    const now = new Date();
    const email: Email = Email.create(props.email as unknown as string);

    const userProps: UserProps = {
      username: props.username,
      password: props.password,
      email: email.Value,
      role: props.role,
      created_at: props.created_at ?? now,
      updated_at: props.updated_at ?? now,
    };
    const user = new User(userProps, id);
    if (!id) {
      user.addDomainEvent(new UserCreatedEvent(user.id));
    }
    return user;
  }

  // --- Getters for safe access ---
  get email(): string {
    return this._props.email;
  }

  get username(): string {
    return this._props.username;
  }

  get role(): Role {
    return this._props.role;
  }

  // get created_at(): Date {
  //   return this._props.created_at;
  // }

  // get updated_at(): Date {
  //   return this._props.updated_at;
  // }

  // --- Business Logic Methods ---
  public updateUsername(newUsername: string): void {
    const trimmedUsername = newUsername.trim();
    if (!newUsername || newUsername.trim().length < 3)
      throw new ArgumentNotProvidedException('New username is required');
    if (newUsername.length > 20)
      throw new ArgumentOutOfRangeException(
        'Username cannot exceed 20 characters.',
      );

    if (this._props.username !== trimmedUsername) {
      this._props.username = trimmedUsername;
      this.touch();
      this.addDomainEvent(new UserUpdatedEvent(this._id, [trimmedUsername]));
    }
  }

  public updateEmail(newEmail: string): void {
    const normalizedEmail = newEmail.toLocaleLowerCase().trim();
    const email = Email.create(normalizedEmail);
    if (this._props.email !== email.Value) {
      this._props.email = email.Value;
      this.touch();
      this.addDomainEvent(new UserUpdatedEvent(this.id, [email.Value]));
    }
  }

  public changeRole(newRole: Role): void {
    if (!newRole || !Object.values(Role).includes(newRole))
      throw new ArgumentInvalidException('Invalid user role');

    if (this._props.role !== newRole) {
      this._props.role = newRole;
      this.touch();
      this.addDomainEvent(new UserUpdatedEvent(this.id, [newRole]));
    }
  }

  public changePassword(newPassword: string): void {
    if (!newPassword)
      throw new ArgumentNotProvidedException('New password is required');
    if (this._props.password !== newPassword) {
      this._props.password = newPassword;
      this.touch();
      // Avoid adding password changes to generic UserUpdatedEvent unless needed
      // Consider a specific PasswordChangedEvent if required
    }
  }

  public promoteToAdmin(): void {
    this._props.role = Role.ADMIN;
  }

  public demoteToUser(): void {
    this._props.role = Role.USER;
  }

  public isAdmin(): boolean {
    return this._props.role === Role.ADMIN;
  }

  // --- Validation ---
  private static validateProps(props: UserProps): void {
    if (!props.email)
      throw new ArgumentNotProvidedException('User email is required');
    if (!props.username)
      throw new ArgumentNotProvidedException('Username is required');
    if (!props.password)
      throw new ArgumentNotProvidedException('Password hash is required');
    if (!props.role || !Object.values(Role).includes(props.role))
      throw new ArgumentInvalidException('Invalid user role');
    // Add more specific format validations (e.g., email format, username length/chars)
    if (props.username.length > 50)
      throw new ArgumentOutOfRangeException('Username too long');
    if ((props.email as unknown as string).length > 50)
      throw new ArgumentOutOfRangeException('Email too long');
    // etc.
  }

  // --- Helper Methods ---
  private touch(): void {
    this._props.updated_at = new Date();
  }
}
