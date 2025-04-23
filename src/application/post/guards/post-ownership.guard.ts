import {
  Injectable,
  CanActivate,
  Logger,
  Inject,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { PostNotFoundException } from 'src/domain/post/exceptions/post.exceptions';
import {
  POST_REPOSITORY_TOKEN,
  IPostRepository,
} from 'src/domain/post/repositories/post.repository.interface';
import { Identifier } from 'src/domain/shared/identifier';
import { Role } from 'src/domain/user/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class PostOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(PostOwnershipGuard.name);

  constructor(
    // Inject the Post Repository to fetch the post
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    // Reflector might be needed if passing parameters via metadata, but often not needed for ownership guards
    // private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const request = gqlCtx.getContext<{ req: Request }>().req;
    const args = gqlCtx.getArgs<{ id?: string; postId?: string }>(); // Get GraphQL arguments

    // --- 1. Get Authenticated User ---
    const user = request.user as AuthenticatedUser | undefined;
    if (!user || !user.userId) {
      // This should technically be caught by JwtAuthGuard first
      this.logger.warn(
        'PostOwnershipGuard executed without authenticated user.',
      );
      throw new ForbiddenException('Authentication required.');
    }
    const currentUserId = Identifier.create(user.userId); // Create Identifier for comparison

    // --- 2. Check for Admin Bypass ---
    // If the user is an Admin, grant access immediately
    if (user.role === Role.ADMIN) {
      this.logger.debug(
        `Admin user (${user.userId}) bypassing ownership check.`,
      );
      return true;
    }

    // --- 3. Identify the Resource ID ---
    // Extract post ID from arguments. This might be 'id' directly or nested in 'args.id'.
    // Adjust based on how your @Args() are defined in the resolver.
    const postIdPrimitive = args.id || args.postId; // Check common argument names
    if (!postIdPrimitive) {
      this.logger.error(
        'Could not determine Post ID from GraphQL arguments for ownership check.',
        args,
      );
      throw new ForbiddenException(
        'Cannot determine resource identifier for authorization.',
      );
    }
    const postId = Identifier.create(postIdPrimitive);

    // --- 4. Fetch the Resource ---
    this.logger.debug(
      `Checking ownership for User ID: ${currentUserId.Value} on Post ID: ${postId.Value}`,
    );
    const post = await this.postRepository.findById(postId.Value as number);
    if (!post) {
      // If the post doesn't exist, throw NotFound rather than Forbidden
      // This prevents leaking information about post existence.
      this.logger.warn(
        `Post ID: ${postId.Value} not found during ownership check.`,
      );
      throw new PostNotFoundException(`ID: ${postIdPrimitive}`); // Use domain exception
    }

    // --- 5. Check Ownership ---
    const isOwner = post.authorId.equals(currentUserId);

    if (!isOwner) {
      this.logger.warn(
        `Authorization Failed: User ${currentUserId.Value} is not the owner of Post ${postId.Value}.`,
      );
      throw new ForbiddenException(
        'You do not have permission to modify this resource.',
      );
    }

    // --- 6. Grant Access ---
    this.logger.debug(
      `Authorization Granted: User ${currentUserId.Value} owns Post ${postId.Value}.`,
    );
    return true; // User is the owner
  }
}
