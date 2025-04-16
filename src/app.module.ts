import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UserAppModule } from './application/user/user.module';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository';
import { AppGraphQLModule } from './presentation/graphql/graphql.module';
import { UserResolver } from './presentation/graphql/user/user.resolver';

@Module({
  imports: [
    CqrsModule.forRoot(),
    InfrastructureModule,
    UserAppModule,
    PrismaModule,
    UserAppModule,
    AppGraphQLModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaUserRepository, UserResolver],
})
export class AppModule {}
