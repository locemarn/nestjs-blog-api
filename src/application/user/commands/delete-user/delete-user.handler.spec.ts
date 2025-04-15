/* eslint-disable @typescript-eslint/unbound-method */
// --- Mocks ---
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../../domain/user/repositories/user.repository.interface';
import { DeleteUserCommand } from './delete-user.command';
import { EventBus } from '@nestjs/cqrs';
import { Identifier } from '../../../../domain/shared/identifier';
import { Test } from '@nestjs/testing';
import { DeleteUserCommandHandler } from './delete-user.handler';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';
import { Role, User } from '../../../../domain/user/entities/user.entity';

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  delete: vi.fn(),
  save: vi.fn(),
  findByEmail: vi.fn(),
};
const mockEventBus = { publish: vi.fn() };
// --- End Mocks ---

describe('Delete user command', () => {
  let handler: DeleteUserCommandHandler;
  // let repository: IUserRepository;
  let eventBus: EventBus;

  const userId = Identifier.create(1);

  const mockExistingUser = User.create({
    email: 'test@example.com',
    password: '123456',
    username: 'test',
    role: Role.USER,
  });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeleteUserCommandHandler,
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    handler = new DeleteUserCommandHandler(
      mockUserRepository,
      mockEventBus as unknown as EventBus,
    );
    eventBus = moduleRef.get(EventBus);
  });

  it('should delete user and publish event successfully', async () => {
    (mockUserRepository.findById as Mock).mockResolvedValue(mockUserRepository);
    (mockUserRepository.delete as Mock).mockResolvedValue(true);
    const command = new DeleteUserCommand(+userId.Value);

    const result = await handler.execute(command);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    expect(eventBus.publish).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true });
  });

  it('should throw UserNotFoundException if user does not exist', async () => {
    (mockUserRepository.findById as Mock).mockResolvedValue(null);
    const command = new DeleteUserCommand(999);

    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(mockUserRepository.delete).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should return success: false and not publish event if repository delete fails', async () => {
    (mockUserRepository.findById as Mock).mockResolvedValue(mockExistingUser);
    (mockUserRepository.delete as Mock).mockResolvedValue(false);
    const command = new DeleteUserCommand(+userId.Value);
    const result = await handler.execute(command);
    expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });
});
