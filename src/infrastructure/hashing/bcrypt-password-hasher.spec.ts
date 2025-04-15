import { beforeEach, describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher(); // Uses default salt rounds for test
  });

  it('should hash a password and be different from plain text', async () => {
    const password = 'mysecretpassword';
    const hash = await hasher.hash(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(password.length); // Bcrypt hashes are long
  });

  it('should return true when comparing a correct password', async () => {
    const password = 'TestPassword123!';
    const hash = await hasher.hash(password);
    expect(await hasher.compare(password, hash)).toBe(true);
  });

  it('should return false when comparing an incorrect password', async () => {
    const password = 'TestPassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hash = await hasher.hash(password);
    expect(await hasher.compare(wrongPassword, hash)).toBe(false);
  });

  it('should return false when comparing against an invalid hash', async () => {
    const password = 'TestPassword123!';
    const invalidHash = 'this is definitely not a bcrypt hash';
    expect(await hasher.compare(password, invalidHash)).toBe(false);
  });

  it('should return false when comparing with null or empty strings', async () => {
    const hash = await hasher.hash('password');
    expect(await hasher.compare(null as unknown as string, hash)).toBe(false);
    expect(
      await hasher.compare('password', null as unknown as string),
    ).toBeFalsy();
    expect(await hasher.compare('', hash)).toBe(false);
    expect(await hasher.compare('password', '')).toBe(false);
  });
});
