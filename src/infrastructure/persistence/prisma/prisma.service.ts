import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as process from 'node:process';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error', 'warn'],
    });
    this.logger.log('Info: Prisma service initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (e: unknown) {
      this.logger.error(
        'Failed to connect to the database',
        e instanceof Error ? e.stack : String(e),
      );
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Successfully disconnected to the database');
  }

  // Helper for integration tests - Use with extreme caution!
  // Ensure environment variable check is robust.
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      this.logger.error(
        'Attempted to clean database outside of TEST environment!',
      );
      throw new Error(
        'Database cleaning is only allowed in the test environment.',
      );
    }
    this.logger.warn('Cleaning TEST database...');
    // Use the transaction method to ensure atomicity if possible
    // Order matters due to foreign keys! Adjust based on your FINAL schema.
    try {
      // Example deletion order (adjust based on your schema and relations!)
      await this.$transaction([
        // Delete dependent records first
        this.commentResponse.deleteMany(),
        this.like.deleteMany(),
        this.comment.deleteMany(),
        // Handle M-N relation table if explicit model exists (otherwise handled by Prisma cascade)
        // If using implicit relation table `_CategoryToPost`, Prisma handles cascade if set up,
        // otherwise delete Posts/Categories carefully.
        // this.categoryToPost.deleteMany(), // If explicit join model
        this.post.deleteMany({ where: {} }), // Delete all posts
        this.category.deleteMany({ where: {} }), // Delete all categories
        this.user.deleteMany({ where: {} }), // Delete all users
      ]);
      this.logger.log('TEST database cleaned successfully.');
    } catch (error: unknown) {
      this.logger.error(
        'Error cleaning TEST database',
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // Re-throw to fail tests if cleanup fails
    }
  }

  // Helper for test setup
  applyMigrations() {
    if (process.env.NODE_ENV !== 'test') {
      this.logger.error(
        'Attempted to apply migrations outside of TEST environment!',
      );
      throw new Error(
        'Migrations can only be applied automatically in the test environment.',
      );
    }
    this.logger.log('Applying migrations to TEST database...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      });
      this.logger.log('TEST database migrations applied successfully.');
    } catch (error: unknown) {
      this.logger.error(
        'Failed to apply migrations to test database',
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error('Migration failed, cannot run tests.');
    }
  }
}
