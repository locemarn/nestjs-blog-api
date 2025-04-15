import { DeleteUserOutputDto } from './delete-user.dto';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../../domain/user/repositories/user.repository.interface';
import { DeleteUserCommand } from './delete-user.command';
import { Identifier } from '../../../../domain/shared/identifier';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserDeletedEvent } from '../../../../domain/user/events/user-deleted.event';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand, DeleteUserOutputDto>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<DeleteUserOutputDto> {
    const userId = Identifier.create(+command.userId);
    const hasUser = await this.userRepository.findById(userId);
    if (!hasUser) {
      throw new UserNotFoundException(`ID: ${+command.userId}`);
      // return { success: false };
    }
    const deleted = await this.userRepository.delete(userId);

    if (deleted) {
      this.eventBus.publish(new UserDeletedEvent(userId));
    } else {
      // This might occur if the user was deleted between the check and the delete call,
      // or if the repository's delete method returns false on failure (e.g., P2025).
      console.warn(
        `Failed to delete user ${userId.Value}, possibly already deleted.`,
      );
      // Depending on requirements, either throw an error or return false
      // throw new Error(`Failed to delete user ${userId.Value}`);
    }

    return { success: deleted };
  }
}
