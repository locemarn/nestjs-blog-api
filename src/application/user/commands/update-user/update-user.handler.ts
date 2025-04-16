import { Inject } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/domain/user/repositories/user.repository.interface';
import { UpdateUserCommand } from './update-user.command';
import { UpdateUserOutputDto } from './update-user.dto';
import { Identifier } from '../../../../domain/shared/identifier';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';
import { Email } from '../../../../domain/user/value-objects/email.vo';
import { EmailAlreadyExistsException } from '../../exceptions/email-already-exists.exception';
import { GetUserByIdQuery } from '../../queries/get-user-by-id/get-user-by-id.query';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand, UpdateUserOutputDto>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus, // Inject EventBus (actually IEventPublisher)
    private readonly queryBus: QueryBus, // Inject QueryBus to fetch final state
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserOutputDto> {
    const userId = Identifier.create(command.userId);
    const { email, role, username } = command.data;

    // 1. Fetch existing user
    const user = await this.userRepository.findById(userId);
    if (!user)
      throw new UserNotFoundException(`ID: ${command.userId} not found`);

    // 2. Check uniqueness constraints if fields are changing
    if (email) {
      const normalizedEmail = Email.create(email.toLowerCase().trim());
      if (normalizedEmail.Value !== email) {
        const existingByEmail = await this.userRepository.findByEmail(
          normalizedEmail.Value,
        );
        if (existingByEmail && !existingByEmail.id.equals(user.id)) {
          throw new EmailAlreadyExistsException(email);
        }
        user.updateEmail(normalizedEmail.Value);
      }
    }

    if (username) {
      const trimmedUsername = username.toLowerCase().trim();
      if (trimmedUsername !== user.username) {
        user.updateUsername(trimmedUsername);
      }
    }

    if (role && role !== user.role) {
      user.changeRole(role);
    }

    // 4. Persist changes
    const updatedUser = await this.userRepository.save(user);

    // 5. Publish Domain Events registered on the entity
    // Pass the NestJS EventBus instance (which implements IEventPublisher)
    await updatedUser.publishEvents(this.eventBus);
    // 6. Fetch and return the updated user DTO
    const res = await this.queryBus.execute<
      GetUserByIdQuery,
      UpdateUserOutputDto
    >(new GetUserByIdQuery(+updatedUser.id.Value));

    return res;
  }
}
