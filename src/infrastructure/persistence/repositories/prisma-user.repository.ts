/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Identifier } from 'src/domain/shared/identifier';
import {
  User,
  UserProps,
  Role as DomainRole,
} from 'src/domain/user/entities/user.entity';
import { IUserRepository } from 'src/domain/user/repositories/user.repository.interface';
import { Prisma, User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import { UserNotFoundException } from 'src/domain/exceptions/domain.exceptions';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(private _prisma: PrismaService) {}

  // ---Mappers ---
  private mapToDomain(prismaUser: PrismaUser | null): User | null {
    if (!prismaUser) return null;
    const domainRole = DomainRole[prismaUser.role as keyof typeof DomainRole];
    if (!domainRole) {
      this.logger.error(
        `Role enum mismatch! Prisma Role "${prismaUser.role}" does not exist in DomainRole enum.`,
      );
      throw new Error(
        `Invalid role "${prismaUser.role}" found in database for user ID ${prismaUser.id}.`,
      );
    }
    const userProps: UserProps = {
      email: prismaUser.email,
      password: prismaUser.password,
      username: prismaUser.username,
      role: domainRole,
      created_at: prismaUser.created_at,
      updated_at: prismaUser.updated_at,
    };

    const identifier = Identifier.create(+prismaUser.id);
    return User.create(userProps, identifier);
  }

  private mapToPersistence(
    user: User,
  ): Prisma.UserUncheckedCreateInput | Prisma.UserUncheckedUpdateInput {
    const prismaRole = user.role as PrismaRole;
    return {
      email: user.email,
      username: user.username,
      password: user._props.password,
      role: prismaRole,
    };
  }

  // ===========================================================================
  // == Repository Methods
  // ===========================================================================
  async save(user: User): Promise<User> {
    const persistenceMappedData = this.mapToPersistence(user);
    let savedPrismaUser: PrismaUser;

    try {
      const userIdValue = user.id.Value;
      const isUpdated = userIdValue !== undefined && userIdValue !== 0;
      if (isUpdated) {
        // --- UPDATE ---
        this.logger.debug(`Updating user with ID: ${userIdValue}`);
        const idForWhere = userIdValue as number;
        // Create explicit update data object
        const updateData: Prisma.UserUpdateInput = {
          email: persistenceMappedData.email,
          username: persistenceMappedData.username,
          password: persistenceMappedData.password,
          role: persistenceMappedData.role,
          updated_at: new Date(),
        };
        savedPrismaUser = await this._prisma.user.update({
          where: { id: idForWhere },
          data: updateData,
        });
        this.logger.log(`Updated user with ID: ${savedPrismaUser.id}`);
        // return this.mapToDomain(savedPrismaUser)!;
      } else {
        // --- CREATE ---
        this.logger.debug(`Creating new user with email: ${user.email}`);
        const createData: Prisma.UserCreateInput = {
          email: persistenceMappedData.email as string,
          username: persistenceMappedData.username as string,
          password: persistenceMappedData.password as string,
          role: persistenceMappedData.role as DomainRole,
        };
        savedPrismaUser = await this._prisma.user.create({
          data: createData,
        });
        this.logger.log(`Created user with ID: ${savedPrismaUser.id}`);
      }

      const result = this.mapToDomain(savedPrismaUser);
      if (!result) {
        // This indicates a problem with mapToDomain or unexpected null from save
        this.logger.error(
          `Failed to map saved Prisma user (ID: ${savedPrismaUser?.id}) back to domain entity.`,
        );
        throw new Error('Failed to map saved user back to domain entity.');
      }
      return result as unknown as User;
    } catch (error) {
      this.logger.error(
        `Error saving user (ID: ${user.id?.Value ?? 'NEW'}): ${error.message}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            `Database unique constraint failed on fields: ${String(error.meta?.target)}`,
          );
        }
        if (error.code === 'P2025') {
          // Record not found for update/delete
          // Distinguish between update and delete if necessary
          const operation =
            user.id?.Value && user.id.Value !== 0 ? 'update' : 'operation';
          this.logger.warn(
            `Record to ${operation} not found for ID: ${user.id?.Value}`,
          );
          // Throw a domain/app specific exception might be better here
          throw new UserNotFoundException(
            `User with ID ${user.id?.Value} not found for ${operation}.`,
          );
        }
      }
      throw error; // Re-throw unhandled errors
    }
  }

  async findById(id: Identifier): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id.Value}`);
    try {
      const userId = id.Value as number;
      const prismaUser = await this._prisma.user.findUnique({
        where: { id: userId },
      });
      return this.mapToDomain(prismaUser) as User;
    } catch (error) {
      this.logger.error(
        `Error finding user by ID ${id.Value}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    try {
      const prismaUser = await this._prisma.user.findUnique({
        where: { email },
      });
      return this.mapToDomain(prismaUser);
    } catch (error) {
      this.logger.error(
        `Error finding user by email ${email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(id: Identifier): Promise<boolean> {
    this.logger.debug(`Attempting to delete user with ID: ${id.Value}`);
    try {
      const userId = id.Value as number;
      const foundUser = await this._prisma.user.findFirst({
        where: { id: userId },
      });
      if (!foundUser) return false;

      await this._prisma.user.delete({
        where: { id: userId },
      });
      this.logger.log(`Successfully deleted user with ID: ${id.Value}`);
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`User with ID ${id.Value} not found for deletion.`);
        return false; // Indicate user was not found
      }
      this.logger.error(
        `Error deleting user with ID ${id.Value}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
