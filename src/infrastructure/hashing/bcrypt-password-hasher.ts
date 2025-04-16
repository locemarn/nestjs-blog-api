import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { IPasswordHasher } from 'src/application/user/shared/interfaces/password-hasher.interface';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  // Make salt rounds configurable via environment variable for flexibility
  private readonly SALT_ROUNDS = parseInt(
    process.env.BCRYPT_SALT_ROUNDS || '10',
    10,
  );

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
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
