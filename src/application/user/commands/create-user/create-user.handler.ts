import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { CreateUserOutputDto } from './create-user.dto';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/domain/user/repositories/user.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER_TOKEN,
} from '../../shared/interfaces/password-hasher.interface';
import { EmailAlreadyExistsException } from '../../exceptions/email-already-exists.exception';
import { User } from 'src/domain/user/entities/user.entity';
import { ArgumentInvalidException } from 'src/domain/exceptions/domain.exceptions';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand, CreateUserOutputDto>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserOutputDto> {
    try {
      const { email, username, password, role } = command.input;

      // 1. Check for uniqueness
      const emailLower = email.toLowerCase().trim();
      const usernameLower = username.toLowerCase().trim();

      const existingByEmail = await this.userRepository.findByEmail(emailLower);
      if (existingByEmail) throw new EmailAlreadyExistsException(email);

      // const existingByUsername = await this.userRepository.findByUsername(usernameLower);
      // if (existingByUsername) {
      //   throw new UsernameAlreadyExistsException(username);
      // }

      // 2. Hash password
      const passwordHash = await this.passwordHasher.hash(password);

      // 3. Create domain entity (encapsulates validation and business rules)
      // Wrap domain entity creation in try-catch if its exceptions shouldn't bubble directly
      // or if you want to map them to ApplicationExceptions. For now, let them bubble.
      const user = User.create({
        email: emailLower,
        username: usernameLower,
        password: passwordHash,
        role,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // 4. Persist using repository
      const savedUser = await this.userRepository.save(user);

      // 5. Optional: Publish domain events
      // user.events.forEach(event => this.eventBus.publish(event));

      // 6. Return output DTO
      return {
        id: savedUser.id,
      };
    } catch (error) {
      const err = error as Error;
      if (err instanceof EmailAlreadyExistsException) {
        throw new EmailAlreadyExistsException(err.message);
      }
      throw new ArgumentInvalidException(err.message);
    }
  }
}
