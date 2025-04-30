// --- Define Provider Arrays (Good Practice) ---

import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateCommentCommandHandler } from './commands/create-comment/create-comment.handler';
import { CommentMapper, COMMENT_MAPPER_TOKEN } from './mappers/comment.mapper';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { USER_REPOSITORY_TOKEN } from 'src/domain/user/repositories/user.repository.interface';
import { UpdateCommentCommandHandler } from './commands/update-comment/update-comment.handler';

export const CommentCommandHandlers: Provider[] = [
  CreateCommentCommandHandler,
  UpdateCommentCommandHandler,
  // AddReplyCommandHandler,
  // DeleteCommentCommandHandler,
  // UpdateReplyCommandHandler, // Add when implemented
  // DeleteReplyCommandHandler, // Add when implemented
];

export const CommentQueryHandlers: Provider[] = [
  // GetCommentByIdQueryHandler,
  // GetCommentsByPostQueryHandler,
  // GetReplyByIdQueryHandler, // Add when implemented
];

export const CommentEventHandlers: Provider[] = [
  // LogCommentCreatedHandler, // Add when implemented
  // Add other event handlers here...
];

// --- Module Definition ---

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [
    CommentMapper,
    { provide: COMMENT_MAPPER_TOKEN, useExisting: CommentMapper },
    ...CommentCommandHandlers,
    ...CommentQueryHandlers,
    ...CommentEventHandlers,
    {
      provide: 'IUserRepository',
      useExisting: USER_REPOSITORY_TOKEN,
    },
  ],
  exports: [CommentMapper],
})
export class CommentAppModule {}
