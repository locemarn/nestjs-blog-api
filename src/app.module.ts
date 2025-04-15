import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UserAppModule } from './application/user/user.module';

@Module({
  imports: [
    CqrsModule.forRoot(), // Core CQRS
    InfrastructureModule, // Provides DB access, hashing, etc.
    UserAppModule, // User application logic (depends on Infra interfaces)
    // GraphqlConfigModule, // GraphQL setup
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
