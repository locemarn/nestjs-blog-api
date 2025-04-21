// Command Handlers
import { CreateUserCommandHandler } from './commands/create-user/create-user.handler';
import { UpdateUserCommandHandler } from './commands/update-user/update-user.handler'; // NEW
import { DeleteUserCommandHandler } from './commands/delete-user/delete-user.handler'; // NEW
// Query Handlers
import { GetUserByIdQueryHandler } from './queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByEmailQueryHandler } from './queries/get-user-by-email/get-user-by-email.handler'; // NEW
// Event Handlers - NEW
import { LogUserCreatedHandler } from './event-handlers/log-user-created.handler';
import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_MAPPER_TOKEN, UserMapper } from './mappers/user.mapper';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

export const UserCommandHandlers: Provider[] = [
  CreateUserCommandHandler,
  UpdateUserCommandHandler,
  DeleteUserCommandHandler,
];

export const UserQueryHandlers: Provider[] = [
  GetUserByIdQueryHandler,
  GetUserByEmailQueryHandler,
];

export const UserEventHandlers: Provider[] = [LogUserCreatedHandler];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [
    UserMapper,
    { provide: USER_MAPPER_TOKEN, useExisting: UserMapper },
    ...UserCommandHandlers,
    ...UserQueryHandlers,
    ...UserEventHandlers,
  ],
  exports: [UserMapper],
})
export class UserAppModule {}
