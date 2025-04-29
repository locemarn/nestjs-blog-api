import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/domain/user/repositories/user.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER_TOKEN,
} from '../../shared/interfaces/password-hasher.interface';
import { CreateUserCommandHandler } from './create-user.handler';
import { Test } from '@nestjs/testing';
import { Role, User } from 'src/domain/user/entities/user.entity';
import { Identifier } from 'src/domain/shared/identifier';
import { CreateUserCommand } from './create-user.command';
import { EmailAlreadyExistsException } from '../../exceptions/email-already-exists.exception';
import { EventBus, QueryBus } from '@nestjs/cqrs';

// Mocks
const mockUserRepository: Partial<IUserRepository> = {
  save: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  delete: vi.fn(),
};

const mockPasswordHasher: Partial<IPasswordHasher> = {
  hash: vi.fn(() => Promise.resolve('')),
};

const mockEventBus = {
  publish: vi.fn(),
  mergeObjectContext: vi.fn(<T>(entity: T): T => entity),
};
const mockQueryBus = { execute: vi.fn() };

describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  // let eventBus: EventBus;
  // let queryBus: QueryBus;

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateUserCommandHandler,
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        { provide: PASSWORD_HASHER_TOKEN, useValue: mockPasswordHasher },
        { provide: EventBus, useValue: mockEventBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    handler = moduleRef.get(CreateUserCommandHandler);
    // eventBus = moduleRef.get(EventBus);
    // queryBus = moduleRef.get(QueryBus);

    // Mock implementation for successfuly case by default
    (mockPasswordHasher.hash as Mock).mockResolvedValue('hashed_password');
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(null);
    (mockUserRepository.findById as Mock).mockResolvedValue(null);
    (mockUserRepository.delete as Mock).mockResolvedValue(null);
    (mockUserRepository.save as Mock).mockResolvedValue((user: User) => {
      const props = {
        username: user._props.username,
        password: user._props.password,
        email: user._props.email,
        role: user._props.role,
      };
      const id = user.id.Value === 0 ? Identifier.create(1) : user.id;
      return User.create(props, id);
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create a new user successfully', async () => {
    const command = new CreateUserCommand({
      email: 'test@email.com',
      username: 'username',
      password: 'password1234',
      role: Role.USER,
    });
    await handler.execute(command);
    const savedUserArg = (mockUserRepository.save as Mock).mock
      .calls[0][0] as User;

    expect(mockUserRepository.save).toHaveBeenCalledOnce();
    expect(savedUserArg).toBeInstanceOf(User);
    expect(savedUserArg.email).toBe('test@email.com');
    expect(savedUserArg.username).toBe('username');
  });

  it('should thrown an EmailAlreadyExistsException if email is taken', async () => {
    const existingUser = User.create(
      {
        email: 'test@example.com',
        username: 'otheruser',
        password: 'somehash',
        role: Role.USER,
      },
      Identifier.create(2),
    );
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(existingUser);

    const command = new CreateUserCommand({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      role: Role.USER,
    });
    await expect(handler.execute(command)).rejects.toThrow(
      EmailAlreadyExistsException,
    );
  });

  /*
  it('should throw UsernameAlreadyExistsException if username is taken', async () => {
    const existingUser = User.create(
      {
        email: 'another@example.com',
        username: 'testuser',
        passwordHash: 'somehash',
        role: Role.USER,
        created_at: new Date(),
        updated_at: new Date(),
      },
      Identifier.create(3),
    );
    mockUserRepository.findByUsername.mockResolvedValue(existingUser); // Email is free, username taken

    const command = new CreateUserCommand({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      UsernameAlreadyExistsException,
    );
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
*/

  // Add test for potential domain validation errors during User.create if needed
  it('should pass domain validation errors up', async () => {
    // Arrange: Setup command with data that would fail User.create validation
    const command = new CreateUserCommand({
      email: 'invalid-email', // Assuming User.create validates email format
      username: 'test',
      password: 'password123',
      role: Role.USER,
    });
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(null);
    (mockPasswordHasher.hash as Mock).mockResolvedValue('hashed_password');

    // Act & Assert
    // Use a try-catch or rejects.toThrow with the specific DomainException type
    await expect(
      handler.execute(command),
    ).rejects.toThrow(/* e.g., ArgumentInvalidException from Domain */);
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
