import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreatePostCommandHandler } from './commands/create-post/create-post.handler';
import { PostMapper } from './mappers/post.mapper';
import { GetPostsQueryHandler } from './queries/get-posts/get-posts.handler';
import { UpdatePostCommandHandler } from './commands/update-post/update-post.handler';
import { DeletePostCommandHandler } from './commands/delete-post/delete-post.handler';
import { PublishPostCommandHandler } from './commands/publish-post/publish-post.handler';
import { UnpublishPostCommandHandler } from './commands/unpublish-post/unpublish-post.handler';

export const PostCommandHandlers: Provider[] = [
  CreatePostCommandHandler,
  UpdatePostCommandHandler,
  DeletePostCommandHandler,
  PublishPostCommandHandler,
  UnpublishPostCommandHandler,
];

export const PostQueryHandlers: Provider[] = [
  // GetPostByIdQueryHandler,
  GetPostsQueryHandler,
  // Add other query handlers here
];

// export const PostEventHandlers: Provider[] = [
//   LogPostCreatedHandler, // Example
//   // Add other event handlers here
// ];

@Module({
  imports: [CqrsModule],
  providers: [
    PostMapper,
    ...PostCommandHandlers,
    ...PostQueryHandlers,
    // ...PostEventHandlers,
  ],
  exports: [PostMapper],
})
export class PostAppModule {}
