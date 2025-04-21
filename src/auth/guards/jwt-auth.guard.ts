import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql'; // Import GqlExecutionContext

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Use the 'jwt' strategy name
  // Override getRequest for GraphQL Context
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    // Return the request object from the GraphQL context
    const { req } = ctx.getContext<{ req: Request }>();
    return req;
  }

  // Optional: Override handleRequest for custom error handling or logging
  // handleRequest(err, user, info, context, status) {
  //    if (err || !user) {
  //       console.error('JWT Auth Error:', info?.message || err?.message);
  //       throw err || new UnauthorizedException('Invalid or missing token.');
  //    }
  //    return user; // Return the user object decoded by JwtStrategy.validate
  // }
}
