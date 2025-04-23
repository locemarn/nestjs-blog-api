import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreatePostCommandHandler } from './commands/create-post/create-post.handler';
import { POST_MAPPER_TOKEN, PostMapper } from './mappers/post.mapper';
import { GetPostsQueryHandler } from './queries/get-posts/get-posts.handler';
import { UpdatePostCommandHandler } from './commands/update-post/update-post.handler';
import { DeletePostCommandHandler } from './commands/delete-post/delete-post.handler';
import { PublishPostCommandHandler } from './commands/publish-post/publish-post.handler';
import { UnpublishPostCommandHandler } from './commands/unpublish-post/unpublish-post.handler';
import { GetPostByIdQueryHandler } from './queries/get-post-by-id/get-post-by-id.handler';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { LogPostCreatedHandler } from './event-handlers/log-post-created.handler';
import { PostOwnershipGuard } from './guards/post-ownership.guard';

export const PostCommandHandlers: Provider[] = [
  CreatePostCommandHandler,
  UpdatePostCommandHandler,
  DeletePostCommandHandler,
  PublishPostCommandHandler,
  UnpublishPostCommandHandler,
];

export const PostQueryHandlers: Provider[] = [
  GetPostByIdQueryHandler,
  GetPostsQueryHandler,
];

export const PostEventHandlers: Provider[] = [LogPostCreatedHandler];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [
    PostMapper,
    { provide: POST_MAPPER_TOKEN, useExisting: PostMapper },
    ...PostCommandHandlers,
    ...PostQueryHandlers,
    ...PostEventHandlers,
    PostOwnershipGuard,
  ],
  exports: [PostMapper],
})
export class PostAppModule {}
