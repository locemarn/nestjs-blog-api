import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from 'src/application/user/shared/interfaces/password-hasher.interface';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly logger = new Logger(BcryptPasswordHasher.name);
  private readonly SALT_ROUNDS = parseInt(
    process.env.BCRYPT_SALT_ROUNDS || '10',
    10,
  );

  constructor() {
    if (isNaN(this.SALT_ROUNDS) || this.SALT_ROUNDS < 4) {
      this.logger.warn(
        `Invalid BCRYPT_SALT_ROUNDS value. Using default of 10.`,
      );
      this.SALT_ROUNDS = 10;
    }
  }

  async hash(password: string): Promise<string> {
    if (!password) {
      this.logger.error('Attempted to hash an empty password.');
      throw new InternalServerErrorException('Cannot hash an empty password.');
    }
    try {
      // Use the configured SALT_ROUNDS
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hashedPassword;
    } catch (error) {
      this.logger.error('Failed to hash password using bcrypt:', error);
      // Don't return a fake string like "erro". Throw an exception.
      throw new InternalServerErrorException('Password hashing failed.');
    }
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    if (!plain || !hashed) {
      return false; // Avoid errors with null/undefined inputs
    }
    try {
      return await bcrypt.compare(plain, hashed);
    } catch (error) {
      // Log error for invalid hash format etc.
      console.error('Bcrypt comparison error:', error);
      return false;
    }
  }
}
