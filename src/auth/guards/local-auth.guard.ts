import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

interface GqlContext {
  req: Request;
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlReq = ctx.getContext<GqlContext>().req;
    const args = ctx.getArgs<{ input: { email: string; password: string } }>();

    if (args.input) {
      gqlReq.body = args.input;
    }

    return gqlReq;
  }
}
