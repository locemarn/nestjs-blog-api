export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export const PASSWORD_HASHER_TOKEN = Symbol('IPasswordHasher');
