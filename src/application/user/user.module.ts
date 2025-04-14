import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserMapper } from './mappers/user.mapper';

// Command Handlers
import { CreateUserCommandHandler } from './commands/create-user/create-user.handler';
import { UpdateUserCommandHandler } from './commands/update-user/update-user.handler'; // NEW
// import { DeleteUserCommandHandler } from './commands/delete-user/delete-user.handler'; // NEW

// Query Handlers
import { GetUserByIdQueryHandler } from './queries/get-user-by-id/get-user-by-id.handler';
// import { GetUserByEmailQueryHandler } from './queries/get-user-by-email/get-user-by-email.handler'; // NEW

// Event Handlers - NEW
// import { LogUserCreatedHandler } from './event-handlers/log-user-created.handler';
// Import other event handlers (e.g., SendWelcomeEmailHandler)

export const UserCommandHandlers: Provider[] = [
  CreateUserCommandHandler,
  UpdateUserCommandHandler, // NEW
  // DeleteUserCommandHandler, // NEW
];

export const UserQueryHandlers: Provider[] = [
  GetUserByIdQueryHandler,
  // GetUserByEmailQueryHandler, // NEW
];

// NEW: Define Event Handlers
export const UserEventHandlers: Provider[] = [
  // LogUserCreatedHandler,
  // Add other handlers: SendWelcomeEmailHandler, ...
];

@Module({
  imports: [CqrsModule],
  providers: [
    UserMapper,
    UpdateUserCommandHandler,
    ...UserCommandHandlers,
    ...UserQueryHandlers,
    ...UserEventHandlers, // Register Event Handlers
  ],
  exports: [UserMapper],
})
export class UserAppModule {}
