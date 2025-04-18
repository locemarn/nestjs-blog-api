import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreatePostCommandHandler } from './commands/create-post/create-post.handler';
import { PostMapper } from './mappers/post.mapper';

export const PostCommandHandlers: Provider[] = [
  CreatePostCommandHandler,
  // UpdatePostCommandHandler,
  // DeletePostCommandHandler,
  // PublishPostCommandHandler,
  // UnpublishPostCommandHandler,
  // Add other command handlers here
];

// export const PostQueryHandlers: Provider[] = [
//   GetPostByIdQueryHandler,
//   GetPostsQueryHandler,
//   // Add other query handlers here
// ];

// export const PostEventHandlers: Provider[] = [
//   LogPostCreatedHandler, // Example
//   // Add other event handlers here
// ];

@Module({
  imports: [CqrsModule],
  providers: [
    PostMapper,
    ...PostCommandHandlers,
    // ...PostQueryHandlers,
    // ...PostEventHandlers,
  ],
  exports: [PostMapper],
})
export class PostAppModule {}
