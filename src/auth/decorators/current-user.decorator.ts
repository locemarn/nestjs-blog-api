import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from 'src/domain/user/entities/user.entity';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Define the shape of the user object attached by JwtStrategy.validate
// Matches the return value of validate() in jwt.strategy.ts
export interface AuthenticatedUser {
  userId: number;
  username: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<{ req: { user?: AuthenticatedUser } }>();
    // request.user is populated by Passport during the JWT validation process (JwtStrategy.validate)
    return req.user;
  },
);

/**
 * Custom decorator to assign required roles to a route handler or class.
 * Example: @Roles(Role.ADMIN, Role.EDITOR)
 * @param roles One or more Role enum values required for access.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
