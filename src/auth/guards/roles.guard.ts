/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from 'generated/prisma';
import {
  ROLES_KEY,
  AuthenticatedUser,
} from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Inject Reflector to read metadata

  canActivate(context: ExecutionContext): boolean {
    // --- 1. Get Required Roles from Metadata ---
    // Get the roles specified by the @Roles(...) decorator on the handler
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Check method decorator first
      context.getClass(), // Check class decorator if method has none
    ]);

    // If no @Roles decorator is applied, the route is considered public from this guard's perspective
    // (Other guards like JwtAuthGuard might still protect it)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific roles required by this guard
    }

    // --- 2. Get User from Request Context ---
    // Get the user object attached by the preceding JwtAuthGuard/JwtStrategy
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthenticatedUser | undefined; // User populated by JwtStrategy.validate

    // If no user object is attached (e.g., JwtAuthGuard didn't run or failed), deny access
    if (!user || !user.role) {
      // This case should ideally be caught by JwtAuthGuard first, but check defensively
      return false;
    }

    // --- 3. Check if User Has Required Role ---
    // Check if the user's role (e.g., user.role which is 'ADMIN' or 'USER')
    // is included in the list of roles required by the @Roles decorator.
    // This assumes user.role is a single role. If a user can have multiple roles,
    // you'd check if any of the user's roles match any of the required roles.
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    return hasRequiredRole; // Grant access only if user has at least one required role
  }
}
