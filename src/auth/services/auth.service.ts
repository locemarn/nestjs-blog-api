import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { User } from 'generated/prisma';
import { CreateUserCommand } from 'src/application/user/commands/create-user/create-user.command';
import { EmailAlreadyExistsException } from 'src/application/user/exceptions/email-already-exists.exception';
import { UsernameAlreadyExistsException } from 'src/application/user/exceptions/username-already-exists.exception';
import {
  PASSWORD_HASHER_TOKEN,
  IPasswordHasher,
} from 'src/application/user/shared/interfaces/password-hasher.interface';
import { Identifier } from 'src/domain/shared/identifier';
import {
  USER_REPOSITORY_TOKEN,
  IUserRepository,
} from 'src/domain/user/repositories/user.repository.interface';
import { AuthPayloadDto } from '../dto/auth-payload.dto';
import { RegisterInputDto } from '../dto/register.input';
import { Role } from 'src/domain/user/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * Validates user credentials for LocalStrategy.
   * Returns the user entity if valid, null otherwise.
   */
  async validateUserCredentials(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`Validating credentials for: ${email}`);

    const user = await this.userRepository.findByEmail(email.toLowerCase());

    if (user && user._props.password) {
      const isPasswordMatching = await this.passwordHasher.compare(
        pass,
        user._props.password,
      );
      if (isPasswordMatching) {
        this.logger.log(
          `Credentials validated successfully for user ID: ${user.id.Value}`,
        );

        const userWithoutPassword: Omit<User, 'password'> = {
          id: user.id.Value as number,
          email: user.email,
          username: user.username,
          role: user.role,
          created_at: user._props.created_at as Date,
          updated_at: user._props.updated_at as Date,
        };
        return userWithoutPassword;
      }
    }
    this.logger.warn(`Credential validation failed for: ${email}`);
    return null;
  }

  /**
   * Generates JWT access token upon successful login.
   */
  async login(user: Omit<User, 'password'>): Promise<AuthPayloadDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    this.logger.log(`Generating JWT for user ID: ${payload.sub}`);
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn =
      this.configService.get<string>('JWT_EXPIRATION_TIME') || '3600s';

    if (!secret) {
      this.logger.error('JWT_SECRET is not defined in environment variables!');
      throw new Error('Internal server configuration error.'); // Don't expose details
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    return { accessToken };
  }

  /**
   * Handles user registration.
   * Uses CreateUserCommand to ensure consistency with user creation logic.
   */
  async register(registerDto: RegisterInputDto): Promise<AuthPayloadDto> {
    this.logger.log(`Attempting registration for email: ${registerDto.email}`);
    try {
      // Use the existing command to handle creation, validation, hashing, events etc.
      const command = new CreateUserCommand({
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password,
        role: registerDto.role || Role.USER, // Allow role specification? Usually defaults to USER
      });
      const createdUserResult = await this.commandBus.execute<
        CreateUserCommand,
        { id: number }
      >(command);

      // Fetch the newly created user (simple version for JWT payload)
      // In real app, might get this data back from command/event if designed that way
      const newUser = await this.userRepository.findById(
        Identifier.create(createdUserResult.id),
      );
      if (!newUser) {
        this.logger.error(
          `Failed to fetch newly registered user: ${createdUserResult.id}`,
        );
        throw new Error(
          'Registration completed but failed to retrieve user data.',
        );
      }

      this.logger.log(
        `Registration successful for user ID: ${newUser.id.Value}`,
      );

      const userWithoutPassword: Omit<User, 'password'> = {
        id: newUser.id.Value as number,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        created_at: newUser._props.created_at as Date,
        updated_at: newUser._props.updated_at as Date,
      };

      return this.login(userWithoutPassword);
    } catch (err) {
      const error = err as Error;
      // Handle specific known exceptions from CreateUserCommand
      if (
        error instanceof EmailAlreadyExistsException ||
        error instanceof UsernameAlreadyExistsException
      ) {
        this.logger.warn(`Registration failed: ${error.message}`);
        throw new ConflictException(error.message); // Throw 409 Conflict
      }
      // Handle domain validation errors from User.create
      // if (error instanceof DomainException) { ... throw BadRequestException ... }

      this.logger.error(
        `Unexpected error during registration: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw unexpected errors
    }
  }
}
