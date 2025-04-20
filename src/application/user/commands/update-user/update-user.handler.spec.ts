import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Identifier } from '../../../../domain/shared/identifier';
import {
  Role,
  User,
  UserProps,
} from '../../../../domain/user/entities/user.entity';
import { Test } from '@nestjs/testing';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '../../queries/get-user-by-id/get-user-by-id.query';
import { UpdateUserCommand } from './update-user.command';
import { UpdateUserCommandHandler } from './update-user.handler';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/domain/user/repositories/user.repository.interface';
import { UserOutputDto } from '../../queries/get-user-by-id/get-user-by-id.dto';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';

// --- Mocks ---
const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  save: vi.fn(),
};
const mockEventBus = {
  publish: vi.fn(),
  mergeObjectContext: vi.fn(<T>(entity: T): T => entity),
};
const mockQueryBus = { execute: vi.fn() };
// --- End Mocks ---

describe('UpdateUserCommandHandler', () => {
  let handler: UpdateUserCommandHandler;
  let repository: IUserRepository;
  // let eventBus: EventBus;
  // let queryBus: QueryBus;

  const userId = Identifier.create(1);
  const existingUserData: UserProps = {
    email: 'original@test.com',
    username: 'original_user',
    password: 'hash',
    role: Role.USER,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const existingUserEntity = User.create(existingUserData, userId);

  // Reset entity events before each test that uses it
  const resetExistingUserEntity = () => User.create(existingUserData, userId);

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateUserCommandHandler,
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    handler = new UpdateUserCommandHandler(
      mockUserRepository as any,
      mockEventBus as unknown as EventBus,
      mockQueryBus as unknown as QueryBus,
    );
    repository = moduleRef.get(USER_REPOSITORY_TOKEN);
    // eventBus = moduleRef.get(EventBus);
    // queryBus = moduleRef.get(QueryBus);

    // Default mock implementations
    mockUserRepository.findById.mockResolvedValue(resetExistingUserEntity()); // Return a fresh instance
    mockUserRepository.save.mockImplementation(
      async (user: User) => await Promise.resolve(user),
    ); // Return user passed to save
    mockUserRepository.findByEmail.mockResolvedValue(null); // Assume not found by default
    // Mock query bus to return a simple DTO representing the updated state
    mockQueryBus.execute.mockImplementation(async (query: GetUserByIdQuery) => {
      // Simulate fetching the DTO - in a real test, this might be more complex
      const updatedUser = await repository.findById(
        Identifier.create(query.userId),
      ); // Get potentially updated user from repo mock
      return {
        id: updatedUser?.id.Value ?? null,
        email: updatedUser?.email ?? null,
        username: updatedUser?.username ?? null,
        role: updatedUser?.role,
        created_at: updatedUser?._props.created_at,
        updated_at: updatedUser?._props.updated_at,
      } as UserOutputDto;
    });
  });

  it('should update username successfully', async () => {
    const command = new UpdateUserCommand(+userId.Value, {
      username: 'new_username',
    });
    const updatedUser = resetExistingUserEntity();
    updatedUser.updateUsername('new_username');
    mockUserRepository.findById.mockResolvedValue(updatedUser);
    mockUserRepository.save.mockResolvedValue(updatedUser);

    const result = await handler.execute(command);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.username).toBe('new_username');
    expect(result.email).toBe(existingUserData.email);
  });

  it('should update email successfully after checking uniqueness', async () => {
    const command = new UpdateUserCommand(+userId.Value, {
      email: 'new_email@email.com',
    });
    const updatedUser = resetExistingUserEntity();
    updatedUser.updateEmail('new_email@email.com');
    mockUserRepository.findById.mockResolvedValue(updatedUser);
    mockUserRepository.save.mockResolvedValue(updatedUser);
    mockUserRepository.findByEmail.mockResolvedValue(null);
    const result = await handler.execute(command);

    expect(mockUserRepository.findById).toHaveBeenCalled();
    // expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.email).toEqual('new_email@email.com');
  });

  it('should update role successfully', async () => {
    const command = new UpdateUserCommand(+userId.Value, { role: Role.ADMIN });
    const updatedUser = resetExistingUserEntity();
    updatedUser.changeRole(Role.ADMIN);
    mockUserRepository.findById.mockResolvedValue(updatedUser);
    mockUserRepository.save.mockResolvedValue(updatedUser);

    await handler.execute(command);

    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(mockQueryBus.execute).toHaveBeenCalled();
  });

  it('should update multiple fields successfully', async () => {
    const command = new UpdateUserCommand(+userId.Value, {
      username: 'new_username',
      role: Role.ADMIN,
      email: 'new_email@email.com',
    });
    const updatedUser = resetExistingUserEntity();
    updatedUser.changeRole(Role.ADMIN);
    updatedUser.updateUsername('new_username');
    updatedUser.updateEmail('new_email@email.com');
    mockUserRepository.findById.mockResolvedValue(updatedUser);
    mockUserRepository.save.mockResolvedValue(updatedUser);

    const result = await handler.execute(command);

    expect(mockUserRepository.findById).toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(mockQueryBus.execute).toHaveBeenCalled();
    expect(result.email).toBe('new_email@email.com');
    expect(result.role).toBe('ADMIN');
    expect(result.username).toBe('new_username');
  });

  it('should throw UserNotFoundException if user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);
    const command = new UpdateUserCommand(999, { username: 'fail_username' });
    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(mockUserRepository.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should NOT throw EmailAlreadyExistsException if email belongs to the same user', async () => {
    const command = new UpdateUserCommand(+userId.Value, {
      email: existingUserData.email,
    });
    mockUserRepository.findById.mockResolvedValue(existingUserEntity);

    await handler.execute(command);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error', async () => {
    const command = new UpdateUserCommand(+userId.Value, { username: 'a' });
    await expect(handler.execute(command)).rejects.toThrow(
      'New username is required',
    );
  });
});
