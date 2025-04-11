import { Identifier } from 'src/domain/shared/identifier';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: Identifier): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: Identifier): Promise<boolean>;
}

// Define an injection token for NestJS DI
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
