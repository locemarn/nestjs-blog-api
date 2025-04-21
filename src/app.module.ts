import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserAppModule } from './application/user/user.module';
import { AppGraphQLModule } from './presentation/graphql/graphql.module';
import { UserResolver } from './presentation/graphql/user/user.resolver';
import { PostAppModule } from './application/post/post.module';
import { PostResolver } from './presentation/graphql/post/post.resolver';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [
    CqrsModule.forRoot(),
    InfrastructureModule,
    UserAppModule,
    PostAppModule,
    AppGraphQLModule,
  ],
  controllers: [],
  providers: [Logger, UserResolver, PostResolver],
})
export class AppModule {}
