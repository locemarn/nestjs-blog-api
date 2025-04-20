/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import {
  Role,
  User,
  UserProps,
} from '../../../domain/user/entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';
import { Identifier } from 'src/domain/shared/identifier';

// --- Configuration & Helpers ---

// Load .env.test to get TEST_DATABASE_URL
config({ path: '.env.test', override: true }); // Ensure .env.test takes precedence

const TEST_DATABASE_URL = process.env.DATABASE_URL; // Variable name used by Prisma
if (
  !TEST_DATABASE_URL ||
  !(TEST_DATABASE_URL.includes('test') || TEST_DATABASE_URL.includes('5499'))
) {
  // Safety check using port or name
  throw new Error(
    `FATAL: DATABASE_URL (${TEST_DATABASE_URL}) for testing is not set, does not contain "test", or the expected test port (5499). Aborting tests.`,
  );
}

// Use a separate PrismaClient instance for direct DB manipulation in tests
const prismaTestClient = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

// Helper function to apply migrations to the test database
const setupTestDatabase = () => {
  // console.info(`Applying migrations to TEST database: ${TEST_DATABASE_URL}`);
  try {
    execSync(`npx prisma migrate deploy --schema=./prisma/schema.prisma`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }, // Pass correct DB URL
    });
    // console.info('Test database migrations applied successfully.');
  } catch (error) {
    console.error('Failed to apply migrations to test database:', error);
    throw new Error('Migration failed, cannot run integration tests.');
  }
};

// Helper function to clean the test database before each test
const resetDatabase = async () => {
  // console.info('Resetting TEST database...');
  // **IMPORTANT**: Adjust deletion order based on your FINAL schema's foreign key constraints!
  // Example order: Dependent tables first. Get table names from your Prisma schema.
  const tableNames = [
    'CommentResponse',
    'Like',
    'Comment',
    '_CategoryToPost',
    'Post',
    'Category',
    'User',
  ];
  await prismaTestClient.$connect();
  try {
    // Iterate in reverse for deletion based on typical dependencies
    for (const tableName of tableNames.reverse()) {
      try {
        // Use Prisma Client's generated delegate for type safety if possible
        const delegate = prismaTestClient[
          tableName.charAt(0).toLowerCase() + tableName.slice(1)
        ] as unknown as { deleteMany: (args?: object) => Promise<unknown> };
        if (delegate && typeof delegate.deleteMany === 'function') {
          await delegate.deleteMany({});
        } else if (tableName === '_CategoryToPost') {
          // Handle implicit M-N tables if needed (often handled by cascade)
          // Or use raw SQL if necessary:
          // await prismaTestClient.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
          // console.warn(
          //   `Skipping cleanup for potentially implicit table: ${tableName}. Relying on cascades or manual cleanup.`,
          // );
        } else {
          // console.warn(
          //   `Could not find deleteMany method for table: ${tableName}. Skipping cleanup or use raw SQL.`,
          // );
          // Use raw SQL as fallback if needed (requires knowing exact table name)
          // await prismaTestClient.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
        }
      } catch (subError: Error | any) {
        console.warn(
          `Could not clean table ${tableName}: ${(subError as Error).message}. May already be empty or missing.`,
        );
      }
    }
    // console.info('TEST database reset successfully.');
  } catch (error: Error | unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      `Error resetting TEST database: ${errorMessage}`,
      error instanceof Error ? error.stack : '',
    );
    throw new Error(
      `Failed to reset test database: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  } finally {
    await prismaTestClient.$disconnect();
  }
};

// Helper to generate unique user data
const generateUniqueUserData = (suffix: string | number = randomUUID()) => ({
  email: `test-${suffix}@integration.com`.toLowerCase().trim(),
  username: `testuser_integ_${suffix}`,
  password: `hashed_password_integ_${suffix}`,
  role: Role.USER,
  // created_at: new Date(), // Or omit if relying on DB default
  // updated_at: new Date(), // Or omit if relying on DB default/trigger
});

// --- Test Suite ---
describe('PrismaUserRepository (Integration)', () => {
  let app: TestingModule;
  let prismaService: PrismaService;
  let repository: PrismaUserRepository;

  beforeAll(async () => {
    // 1. Apply migrations ONCE
    setupTestDatabase();

    // 2. Compile NestJS testing module
    app = await Test.createTestingModule({
      providers: [PrismaService, PrismaUserRepository],
      // providers: [
      //   PrismaService, // Use real PrismaService connected via DATABASE_URL from .env.test
      //   PrismaUserRepository, // Use the real repository implementation
      // ],
    }).compile();

    // 3. Get instances from DI container
    prismaService = app.get(PrismaService); // This instance uses the URL from .env.test
    repository = app.get(PrismaUserRepository);

    // --- HACKY WORKAROUND ---
    if (repository && prismaService && !repository['_prisma']) {
      // console.warn(
      //   '>>> WARNING: Manually injecting prismaService into repository instance due to DI failure.',
      // );
      repository['_prisma'] = prismaService; // Assign the retrieved service manually
    }
    // --- END HACKY WORKAROUND ---

    // 4. Ensure PrismaService connects (uses onModuleInit)
    // await prismaService.onModuleInit(); // Call explicitly if needed
    // Add a small delay or check connection status if race conditions occur
  }, 60000); // Increase timeout for beforeAll if migrations take time

  // 5. Clean the database BEFORE EACH test
  beforeEach(async () => {
    await resetDatabase();
  }, 30000); // Increase timeout for reset if needed

  // 6. Disconnect PrismaService after all tests
  afterAll(async () => {
    await prismaService?.onModuleDestroy(); // Use ?. for safety
    await app?.close(); // Close NestJS context
  });

  // --- Test Cases ---
  it('should create a new user via save() and return the domain entity', async () => {
    const userData = generateUniqueUserData('create');
    const userDomainEntity = User.create(userData);

    const savedUser = await repository.save(userDomainEntity);

    // expect(savedUser).toBeInstanceOf(User);
    expect(savedUser.id.Value).toBeGreaterThan(0);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser._props.password).toBe(userData.password);
  });

  it('should UPDATE an existing user via save()', async () => {
    const initialData = generateUniqueUserData('update-initial');
    const initialDbUser = await prismaTestClient.user.create({
      data: {
        email: initialData.email,
        username: initialData.username,
        password: initialData.password,
        role: initialData.role,
      },
    });
    const userId = Identifier.create(initialDbUser.id);

    const updatedProps: UserProps = {
      ...initialData,
      username: 'updated_integration_user',
      role: Role.ADMIN,
    };
    const userToUpdate = User.create(updatedProps, userId);

    const savedUser = await repository.save(userToUpdate);

    expect(savedUser.id.Value).toBe(initialDbUser.id);
    expect(savedUser.username).toBe('updated_integration_user');
    expect(savedUser.role).toBe(Role.ADMIN);

    const finalDbUser = await prismaTestClient.user.findUnique({
      where: { id: initialDbUser.id },
    });
    expect(finalDbUser?.username).toBe('updated_integration_user');
    expect(finalDbUser?.role).toBe(Role.ADMIN);
  });

  it('should find a user by ID', async () => {
    const userData = generateUniqueUserData('findId');
    const dbUser = await prismaTestClient.user.create({
      data: { ...userData, password: userData.password },
    });
    const userId = Identifier.create(dbUser.id);
    const foundUser = (await repository.findById(userId)) as User;

    // --- Assertions ---
    expect(foundUser).toBeDefined();
    expect(foundUser).not.toBeNull();
    expect(foundUser).toHaveProperty('id');
    expect(foundUser?.id).toBeInstanceOf(Identifier);
    expect(foundUser).toHaveProperty('email', userData.email);
    expect(foundUser).toHaveProperty('username', userData.username);
    expect(foundUser).toHaveProperty('role', userData.role);
    expect(foundUser).toHaveProperty('_props');
    expect(foundUser?._props).toHaveProperty('password', userData.password);
    expect(foundUser?.email).toBe(userData.email);
  });

  it('should return null when finding by a non-existent ID', async () => {
    const userId = Identifier.create(999999) as unknown as Identifier;
    const foundUser = await repository.findById(userId);

    expect(foundUser).toBeNull();
  });

  it('should find a user by Email', async () => {
    const userData = generateUniqueUserData('findEmail');
    await prismaTestClient.user.create({
      data: { ...userData, password: userData.password },
    });
    const foundUser = await repository.findByEmail(userData.email);
    // --- Assertions ---
    expect(foundUser).toBeDefined();
    expect(foundUser).not.toBeNull();
    expect(foundUser).toHaveProperty('id');
    expect(foundUser?.id).toBeInstanceOf(Identifier);
    expect(foundUser).toHaveProperty('email', userData.email);
    expect(foundUser).toHaveProperty('username', userData.username);
    expect(foundUser).toHaveProperty('role', userData.role);
    expect(foundUser).toHaveProperty('_props');
    expect(foundUser?._props).toHaveProperty('password', userData.password);
    expect(foundUser?.email).toBe(userData.email);
  });

  it('should return null when finding by a non-existent Email', async () => {
    const foundUser = await repository.findByEmail('nonexistent@email.com');
    expect(foundUser).toBeNull();
  });

  it('should DELETE a user by ID and return true', async () => {
    const userData = generateUniqueUserData('delete');
    const dbUser = await prismaTestClient.user.create({
      data: { ...userData, password: userData.password },
    });
    const userId = Identifier.create(dbUser.id);
    const wasDeleted = await repository.delete(userId);
    expect(wasDeleted).toBe(true);
    const findDeleted = await prismaTestClient.user.findUnique({
      where: { id: dbUser.id },
    });
    expect(findDeleted).toBeNull();
  });

  it('should return false when trying to DELETE a non-existent user ID', async () => {
    const wasDeleted = await repository.delete(Identifier.create(888888));
    expect(wasDeleted).toBeFalsy();
  });

  // it('save() should reject with error on unique constraint violation', async () => {
  //   const userData1 = generateUniqueUserData('unique1');
  //   await repository.save(User.create(userData1)); // Save first user

  //   const userData2 = generateUniqueUserData('unique2');
  //   const userWithDuplicateEmail = User.create({
  //     ...userData2,
  //     email: userData1.email,
  //   }); // Duplicate email

  //   // Expect Prisma P2002 to cause repository save to throw (or re-throw) an error
  //   await expect(repository.save(userWithDuplicateEmail)).rejects.toThrow(
  //     /unique constraint failed/i,
  //   );
  // });
});
