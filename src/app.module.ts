import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserAppModule } from './application/user/user.module';
import { AppGraphQLModule } from './presentation/graphql/graphql.module';
import { UserResolver } from './presentation/graphql/user/user.resolver';
import { PostAppModule } from './application/post/post.module';
import { PostResolver } from './presentation/graphql/post/post.resolver';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CategoryAppModule } from './application/category/category.module';
import { CategoryResolver } from './presentation/graphql/category/category.resolver';
import { CommentAppModule } from './application/comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [],
    }),
    CqrsModule.forRoot(),
    InfrastructureModule,
    UserAppModule,
    PostAppModule,
    CategoryAppModule,
    CommentAppModule,
    AuthModule,
    AppGraphQLModule,
  ],
  controllers: [],
  providers: [Logger, UserResolver, PostResolver, CategoryResolver],
})
export class AppModule {}
