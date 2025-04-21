/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { PostContentVo } from 'src/domain/post/value-objects/post-content.vo';
import { PostTitleVo } from 'src/domain/post/value-objects/post-title.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaPostRepository } from './prisma-post.repository';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Post } from 'src/domain/post/entities/post.entity';
import { execSync } from 'child_process';

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
export const resetDatabase = async (prismaTestClient: PrismaClient) => {
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
          console.warn(
            `Skipping cleanup for potentially implicit table: ${tableName}. Relying on cascades or manual cleanup.`,
          );
        } else {
          console.warn(
            `Could not find deleteMany method for table: ${tableName}. Skipping cleanup or use raw SQL.`,
          );
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

// Helper for unique post data
const generateUniquePostData = (
  authorId: Identifier,
  categoryIds: Identifier[] = [],
  published = false,
) => ({
  title: PostTitleVo.create(
    `Test Post ${randomUUID().toString().substring(0, 8)}`,
  ),
  content: PostContentVo.create(
    `Content for test post ${randomUUID().toString().substring(0, 8)}`,
  ),
  userId: authorId,
  categoryIds: categoryIds,
  published: published,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('PrismaPostRepository (Integration)', () => {
  let app: TestingModule;
  let prismaService: PrismaService;
  let repository: PrismaPostRepository;

  beforeAll(async () => {
    setupTestDatabase(); // Apply migrations

    app = await Test.createTestingModule({
      providers: [PrismaService, PrismaPostRepository],
    }).compile();
    prismaService = app.get(PrismaService);
    repository = app.get(PrismaPostRepository);
    await prismaService.onModuleInit();

    // --- HACKY WORKAROUND ---
    if (repository && prismaService && !repository['_prisma']) {
      // console.warn(
      //   '>>> WARNING: Manually injecting prismaService into repository instance due to DI failure.',
      // );
      Object.defineProperty(repository, '_prisma', {
        value: prismaService,
        writable: true,
        configurable: true,
      });
    }
    // --- END HACKY WORKAROUND ---
  }, 6000);

  beforeEach(async () => {
    await resetDatabase(prismaTestClient); // Pass client to reset helper
  }, 30000);

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await app?.close();
    await prismaTestClient?.$disconnect();
  });

  it('save() should CREATE a new post with categories', async () => {
    const user = await prismaTestClient.user.create({
      data: {
        email: `u-${randomUUID().toString().substring(0, 8).toString().substring(0, 10)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8).toString().substring(0, 10)}`,
        password: 'p',
        role: 'USER',
      },
    });

    const cat1 = await prismaTestClient.category.create({
      data: {
        name: `Cat ${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
      },
    });
    const cat2 = await prismaTestClient.category.create({
      data: {
        name: `Cat ${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
      },
    });
    const authorId = Identifier.create(user.id);
    const catId1 = Identifier.create(cat1.id);
    const catId2 = Identifier.create(cat2.id);

    const postData = generateUniquePostData(authorId, [catId1, catId2]);
    const postDomainEntity = Post.create(postData);

    // Act
    const savedPost = await repository.save(postDomainEntity);

    // Assert Domain Object
    expect(savedPost.id.Value).toBeGreaterThan(0);
    expect(savedPost.title.Value).toBe(postData.title.Value);
    expect(savedPost.authorId.equals(authorId)).toBeTruthy();
    expect(savedPost.categoryIds).toHaveLength(2);
    expect(savedPost.categoryIds.some((id) => id.equals(catId1))).toBeTruthy();
    expect(savedPost.categoryIds.some((id) => id.equals(catId2))).toBeTruthy();

    // Assert Database State
    const dbPost = await prismaTestClient.post.findUnique({
      where: { id: savedPost.id.Value as number },
      include: { categories: { select: { id: true } } },
    });
    expect(dbPost).toBeDefined();
    expect(dbPost?.userId).toBe(user.id);
    expect(dbPost?.categories).toHaveLength(2);
    expect(dbPost?.categories.map((c) => c.id).sort()).toEqual(
      [cat1.id, cat2.id].sort(),
    );
  });

  it('save() should UPDATE an existing post, changing categories', async () => {
    // Arrange: Create user, categories, and initial post
    const user = await prismaTestClient.user.create({
      data: {
        email: `u-${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    const cat1 = await prismaTestClient.category.create({
      data: {
        name: `Cat ${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
      },
    });
    const cat2 = await prismaTestClient.category.create({
      data: {
        name: `Cat ${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
      },
    });
    const cat3 = await prismaTestClient.category.create({
      data: {
        name: `Cat ${randomUUID().toString().substring(0, 8).toString().substring(0, 8)}`,
      },
    }); // New category for update
    const authorId = Identifier.create(user.id);
    const catId1 = Identifier.create(cat1.id);
    const catId2 = Identifier.create(cat2.id);
    const catId3 = Identifier.create(cat3.id);

    const initialPost = await prismaTestClient.post.create({
      data: {
        title: 'Initial Update Title',
        content: 'Initial content',
        published: false,
        userId: user.id,
        categories: { connect: [{ id: cat1.id }, { id: cat2.id }] }, // Start with cat1, cat2
      },
    });
    const postId = Identifier.create(initialPost.id);

    // Create domain entity representing updated state (new title, remove cat1, add cat3)
    const updatedProps = {
      title: PostTitleVo.create('UPDATED Title'),
      content: PostContentVo.create('UPDATED Content'),
      userId: authorId,
      published: true,
      categoryIds: [catId2, catId3], // Should end up with cat2, cat3
      created_at: initialPost.created_at, // Keep original create time
      updated_at: new Date(), // Should get updated
    };
    const postToUpdate = Post.create(updatedProps, postId);

    // Act
    const savedPost = await repository.save(postToUpdate);

    // Assert Domain Object
    expect(savedPost.id.Value).toBe(initialPost.id);
    expect(savedPost.title.Value).toBe('UPDATED Title');
    expect(savedPost.content.Value).toBe('UPDATED Content');
    expect(savedPost.isPublished).toBe(true);
    expect(savedPost.categoryIds).toHaveLength(2);
    expect(savedPost.categoryIds.some((id) => id.equals(catId2))).toBe(true);
    expect(savedPost.categoryIds.some((id) => id.equals(catId3))).toBe(true);
    expect(savedPost.categoryIds.some((id) => id.equals(catId1))).toBe(false); // cat1 removed

    // Assert Database State
    const dbPost = await prismaTestClient.post.findUnique({
      where: { id: initialPost.id },
      include: { categories: { select: { id: true } } },
    });
    expect(dbPost?.title).toBe('UPDATED Title');
    expect(dbPost?.published).toBe(true);
    expect(dbPost?.categories).toHaveLength(2);
    expect(dbPost?.categories.map((c) => c.id).sort()).toEqual(
      [cat2.id, cat3.id].sort(),
    );
  });

  it('findById should return post with correct category IDs', async () => {
    // Arrange: Create user, categories, and post with categories
    const user = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    const cat1 = await prismaTestClient.category.create({
      data: {
        /* ... */ name: `Cat ${randomUUID().toString().substring(0, 8)}`,
      },
    });
    const cat2 = await prismaTestClient.category.create({
      data: {
        /* ... */ name: `Cat ${randomUUID().toString().substring(0, 8)}`,
      },
    });
    const post = await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'FindMe',
        content: 'c',
        userId: user.id,
        categories: { connect: [{ id: cat1.id }, { id: cat2.id }] },
      },
    });
    const postId = Identifier.create(post.id);
    const catId1 = Identifier.create(cat1.id);
    const catId2 = Identifier.create(cat2.id);

    // Act
    const foundPost = await repository.findById(postId);

    // Assert
    expect(foundPost).not.toBeNull();
    expect(foundPost?.categoryIds).toHaveLength(2);
    expect(foundPost?.categoryIds.some((id) => id.equals(catId1))).toBe(true);
    expect(foundPost?.categoryIds.some((id) => id.equals(catId2))).toBe(true);
  });

  it('find should filter by published status', async () => {
    // Arrange: Create published and unpublished posts
    const user = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'Pub1',
        content: 'c',
        userId: user.id,
        published: true,
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'Draft1',
        content: 'c',
        userId: user.id,
        published: false,
      },
    });

    // Act: Find published
    const publishedResults = await repository.find({ published: true });
    // Act: Find unpublished
    const unpublishedResults = await repository.find({ published: false });

    // Assert
    expect(publishedResults).toHaveLength(1);
    expect(publishedResults[0].title.Value).toBe('Pub1');
    expect(unpublishedResults).toHaveLength(1);
    expect(unpublishedResults[0].title.Value).toBe('Draft1');
  });

  it('find should filter by authorId', async () => {
    // Arrange: Create posts by different authors
    const user1 = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u1-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u1-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    const user2 = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u2-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u2-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    await prismaTestClient.post.create({
      data: { /* ... */ title: 'U1Post1', content: 'c', userId: user1.id },
    });
    await prismaTestClient.post.create({
      data: { /* ... */ title: 'U2Post1', content: 'c', userId: user2.id },
    });

    // Act
    const user1Posts = await repository.find({
      authorId: Identifier.create(user1.id),
    });

    // Assert
    expect(user1Posts).toHaveLength(1);
    expect(user1Posts[0].title.Value).toBe('U1Post1');
    expect(user1Posts[0].authorId.Value).toBe(user1.id);
  });

  it('find should filter by categoryId', async () => {
    // Arrange: Create categories and posts with different category links
    const user = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    const catA = await prismaTestClient.category.create({
      data: {
        /* ... */ name: `CatA-${randomUUID().toString().substring(0, 8)}`,
      },
    });
    const catB = await prismaTestClient.category.create({
      data: {
        /* ... */ name: `CatB-${randomUUID().toString().substring(0, 8)}`,
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'PostA',
        content: 'c',
        userId: user.id,
        categories: { connect: [{ id: catA.id }] },
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'PostB',
        content: 'c',
        userId: user.id,
        categories: { connect: [{ id: catB.id }] },
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'PostAB',
        content: 'c',
        userId: user.id,
        categories: { connect: [{ id: catA.id }, { id: catB.id }] },
      },
    });

    // Act
    const catAPosts = await repository.find({
      categoryId: Identifier.create(catA.id),
    });

    // Assert
    expect(catAPosts).toHaveLength(2); // PostA and PostAB
    expect(catAPosts.map((p) => p.title.Value).sort()).toEqual(
      ['PostA', 'PostAB'].sort(),
    );
  });

  it('count should return the total number matching filters', async () => {
    // Arrange: Create posts
    const user = await prismaTestClient.user.create({
      data: {
        /* ... */ email: `u-${randomUUID().toString().substring(0, 8)}@test.com`,
        username: `u-${randomUUID().toString().substring(0, 8)}`,
        password: 'p',
        role: 'USER',
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'Pub1',
        content: 'c',
        userId: user.id,
        published: true,
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'Pub2',
        content: 'c',
        userId: user.id,
        published: true,
      },
    });
    await prismaTestClient.post.create({
      data: {
        /* ... */ title: 'Draft1',
        content: 'c',
        userId: user.id,
        published: false,
      },
    });

    // Act
    const totalPublishedCount = await repository.count({ published: true });
    const totalCount = await repository.count(); // Count all

    // Assert
    expect(totalPublishedCount).toBe(2);
    expect(totalCount).toBe(3);
  });
});
