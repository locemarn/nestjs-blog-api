import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { LogUserCreatedHandler } from './log-user-created.handler';
import { Identifier } from '../../../domain/shared/identifier';
import { UserCreatedEvent } from '../../../domain/user/events/user-created.event';

vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

describe('LogUserCreatedHandler', () => {
  let handler: LogUserCreatedHandler;

  beforeEach(() => {
    handler = new LogUserCreatedHandler();
    vi.clearAllMocks();
  });

  it('should log user created event', async () => {
    const userId = Identifier.create(123);
    const event = new UserCreatedEvent(userId);
    const loggerSpy = vi.spyOn(Logger.prototype, 'log');

    handler.handle(event);

    expect(loggerSpy).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(`User Created - ID: ${userId.Value}`),
    );
  });
});
