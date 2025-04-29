/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, Logger } from '@nestjs/common';
import { ICategoryRepository } from 'src/domain/category/repositories/category.repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
  Category,
  CategoryProps,
} from 'src/domain/category/entities/category.entity';
import { CategoryName } from 'src/domain/category/value-objects/category-name.vo';
import { Identifier } from 'src/domain/shared/identifier';
import { Prisma, Category as PrismaCategory } from '@prisma/client';
import {
  CategoryNameAlreadyExistsException,
  CategoryNotFoundException,
} from 'src/domain/category/exceptions/category.exceptions';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  private readonly logger = new Logger(PrismaCategoryRepository.name);

  constructor(private readonly _prisma: PrismaService) {}

  // --- Mappers ---

  /**
   * Maps a Prisma Category record (from DB) to a Domain Category entity.
   */
  private mapToDomain(prismaCategory: PrismaCategory | null): Category | null {
    if (!prismaCategory) {
      return null;
    }

    const categoryNameVo = CategoryName.create(prismaCategory.name);

    const categoryProps: CategoryProps = {
      name: categoryNameVo,
    };

    const identifier = Identifier.create(prismaCategory.id);

    return Category.create(categoryProps, identifier);
  }

  /**
   * Maps a Domain Category entity to the data format needed for Prisma create/update.
   * Primarily focuses on the 'name' field for this simple entity.
   */
  private mapToPersistence(
    category: Category,
  ): Prisma.CategoryUncheckedCreateInput | Prisma.CategoryUpdateInput {
    return {
      name: category.name.Value,
    };
  }

  // --- Repository Methods ---

  async save(category: Category): Promise<Category> {
    const persistenceData = this.mapToPersistence(category);
    const categoryIdValue = category.id?.Value;
    const isUpdate = categoryIdValue !== undefined && categoryIdValue !== 0;

    try {
      let savedOrUpdatedPrismaCategory: PrismaCategory;
      if (isUpdate) {
        // --- UPDATE ---
        const idForWhere = categoryIdValue;
        this.logger.debug(
          `Updating category ID: ${idForWhere} with data: ${JSON.stringify(persistenceData)}`,
        );
        savedOrUpdatedPrismaCategory = await this._prisma.category.update({
          where: { id: idForWhere },
          data: {
            name: persistenceData.name,
          },
        });
        this.logger.log(
          `Updated category with ID: ${savedOrUpdatedPrismaCategory.id}`,
        );
      } else {
        // --- CREATE ---
        this.logger.debug(
          `Creating category with data: ${JSON.stringify(persistenceData)}`,
        );
        savedOrUpdatedPrismaCategory = await this._prisma.category.create({
          data: persistenceData as Prisma.CategoryCreateInput,
        });
        this.logger.log(
          `Created category with ID: ${savedOrUpdatedPrismaCategory.id}`,
        );
      }

      const result = this.mapToDomain(savedOrUpdatedPrismaCategory);
      if (!result) {
        throw new Error('Failed to map saved category back to domain entity.');
      }
      return result;
    } catch (error: unknown) {
      this.logger.error(
        `Error saving category (ID: ${categoryIdValue ?? 'NEW'}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn(
            `Unique constraint failed on category save: ${error.meta?.target}`,
          );
          throw new CategoryNameAlreadyExistsException(
            persistenceData.name as string,
          );
        }
        if (error.code === 'P2025' && isUpdate) {
          this.logger.warn(
            `Category with ID ${categoryIdValue} not found for update.`,
          );
          throw new CategoryNotFoundException(
            `ID: ${categoryIdValue} for update`,
          );
        }
      }
      throw error;
    }
  }

  async findById(id: Identifier): Promise<Category | null> {
    this.logger.debug(`Finding category by ID: ${id.Value}`);
    try {
      const idForWhere = parseInt(String(id.Value), 10);
      if (isNaN(idForWhere)) return null;

      const prismaCategory = await this._prisma.category.findUnique({
        where: { id: idForWhere },
      });

      return this.mapToDomain(prismaCategory);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding category by ID ${id.Value}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async findByName(name: CategoryName): Promise<Category | null> {
    const nameValue = name.Value;
    this.logger.debug(`Finding category by name: ${nameValue}`);
    try {
      const prismaCategory = await this._prisma.category.findFirst({
        where: { name: nameValue },
      });
      return this.mapToDomain(prismaCategory);
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding category by name ${nameValue}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findManyByIds(ids: Identifier[]): Promise<Category[]> {
    if (ids.length === 0) return [];
    const primitiveIds = ids
      .map((id) => parseInt(String(id.Value), 10))
      .filter((id) => !isNaN(id));
    if (primitiveIds.length === 0) return [];

    this.logger.debug(`Finding categories by IDs: ${primitiveIds.join(', ')}`);
    try {
      const prismaCategories = await this._prisma.category.findMany({
        where: {
          id: {
            in: primitiveIds,
          },
        },
      });
      const domainCategories = prismaCategories
        .map((pc) => this.mapToDomain(pc))
        .filter((c) => c !== null);

      if (domainCategories.length !== ids.length) {
        this.logger.warn(
          `Could not find all categories for IDs: ${primitiveIds.join(', ')}. Found ${domainCategories.length}.`,
        );
      }

      return domainCategories;
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding categories by IDs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    this.logger.debug(`Finding all categories`);
    try {
      const prismaCategories = await this._prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return prismaCategories
        .map((pc) => this.mapToDomain(pc))
        .filter((c) => c !== null);
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Error finding all categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(id: Identifier): Promise<boolean> {
    const idForWhere = parseInt(String(id.Value), 10);
    if (isNaN(idForWhere)) {
      this.logger.error(
        `Invalid non-numeric ID passed to category delete: ${id.Value}`,
      );
      return false;
    }
    this.logger.debug(`Attempting to delete category with ID: ${idForWhere}`);
    try {
      await this._prisma.category.delete({
        where: { id: idForWhere },
      });
      this.logger.log(`Successfully deleted category with ID: ${idForWhere}`);
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Record to delete not found - return false as per interface contract
        this.logger.warn(
          `Category with ID ${idForWhere} not found for deletion.`,
        );
        return false;
      }
      // Handle P2003 (Foreign Key Constraint Violation) if posts block deletion
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        this.logger.warn(
          `Cannot delete category ID ${idForWhere} due to existing post associations.`,
        );
        // Re-throw as a domain or application exception (or return false depending on desired behavior)
        throw new Error(
          `Cannot delete category: it is still associated with posts.`,
        ); // Or CategoryInUseException from App layer
      }
      // Log and re-throw any other unexpected database errors
      this.logger.error(
        `Error deleting category with ID ${idForWhere}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
