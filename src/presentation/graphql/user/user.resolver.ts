import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Logger, UseGuards } from '@nestjs/common';

// GraphQL Types, Inputs, Args, Payloads
import { UserType } from './dto/types/user.type';
import { CreateUserInput } from './dto/inputs/create-user.input';
import { UpdateUserInput } from './dto/inputs/update-user.input';
import { GetUserByIdArgs } from './dto/args/get-user-by-id.args';
import { GetUserByEmailArgs } from './dto/args/get-user-by-email.args';
import { DeleteUserArgs } from './dto/args/delete-user.args';
import { DeleteUserPayload } from './dto/types/delete-user.payload';

// Application Commands & Queries
import { GetUserByEmailQuery } from 'src/application/user/queries/get-user-by-email/get-user-by-email.query';
import { GetUserByIdQuery } from 'src/application/user/queries/get-user-by-id/get-user-by-id.query';
import { CreateUserCommand } from 'src/application/user/commands/create-user/create-user.command';
import { UpdateUserCommand } from 'src/application/user/commands/update-user/update-user.command';
import { DeleteUserCommand } from 'src/application/user/commands/delete-user/delete-user.command';

// Application DTOs (for results)
import { UserOutputDto } from 'src/application/user/queries/get-user-by-id/get-user-by-id.dto';
import { CreateUserOutputDto } from 'src/application/user/commands/create-user/create-user.dto';
import { UpdateUserOutputDto } from 'src/application/user/commands/update-user/update-user.dto';
import { DeleteUserOutputDto } from 'src/application/user/commands/delete-user/delete-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/domain/user/entities/user.entity';
import { Roles } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => UserType)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --- Queries ---
  @Query(() => UserType, { name: 'userById', nullable: true })
  async getUserById(
    @Args() args: GetUserByIdArgs,
  ): Promise<UserOutputDto | null> {
    this.logger.log(`Received userById query for ID: ${args.id}`);
    try {
      const user = await this.queryBus.execute<
        GetUserByIdQuery,
        UserOutputDto | null
      >(new GetUserByIdQuery(args.id));
      return user;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error in userById query for ID ${args.id}: ${err.message}`,
        err.stack,
      );
      // Exceptions (like UserNotFoundException) thrown by the handler
      // will be processed by the formatError function in GraphQLModule config.
      // We re-throw here so it gets caught by the GraphQL error handling pipeline.
      throw err;
    }
  }

  @Query(() => UserType, { name: 'userByEmail', nullable: true })
  async getUserByEmail(
    @Args() args: GetUserByEmailArgs,
  ): Promise<UserOutputDto | null> {
    this.logger.log(`Received userByEmail query for Email: ${args.email}`);
    try {
      const user = await this.queryBus.execute<
        GetUserByEmailQuery,
        UserOutputDto | null
      >(new GetUserByEmailQuery(args.email));
      return user;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error in userByEmail query for Email ${args.email}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  // --- Mutations ---

  @Mutation(() => UserType, { description: 'Create a new user account.' })
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<UserOutputDto> {
    this.logger.log(`Received createUser mutation for Email: ${input.email}`);
    try {
      const command = new CreateUserCommand({
        email: input.email,
        username: input.username,
        password: input.password,
        role: input.role,
      });

      const result: CreateUserOutputDto =
        await this.commandBus.execute(command);

      this.logger.log(
        `User created with ID: ${result.id.Value}. Fetching full user data...`,
      );
      const newUser = await this.queryBus.execute<
        GetUserByIdQuery,
        UserOutputDto
      >(new GetUserByIdQuery(+result.id.Value));
      if (!newUser) {
        this.logger.error(
          `Could not fetch newly created user with ID: ${result.id.Value}`,
        );
        throw new Error('Failed to retrieve newly created user.');
      }
      return newUser;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error in createUser mutation for Email ${input.email}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  @Mutation(() => UserType, { description: 'Update an existing user.' })
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args('id', { type: () => ID }) id: number,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserOutputDto> {
    this.logger.log(`Received updateUser mutation for ID: ${id}`);
    try {
      const command = new UpdateUserCommand(+id, {
        email: input.email,
        username: input.username,
        role: input.role,
      });
      const updatedUser: UpdateUserOutputDto =
        await this.commandBus.execute(command);

      return updatedUser as unknown as UserOutputDto;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error in updateUser mutation for ID ${id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  @Mutation(() => DeleteUserPayload, { description: 'Delete a user by ID.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Args() args: DeleteUserArgs): Promise<DeleteUserPayload> {
    this.logger.log(`Received deleteUser mutation for ID: ${args.id}`);
    try {
      const command = new DeleteUserCommand(args.id);
      // Handler returns { success: boolean }
      const result: DeleteUserOutputDto =
        await this.commandBus.execute(command);
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error in deleteUser mutation for ID ${args.id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
