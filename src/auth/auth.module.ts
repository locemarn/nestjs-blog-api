import { Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';

const STRATEGIES: Provider[] = [LocalStrategy, JwtStrategy];
const RESOLVERS: Provider[] = [AuthResolver];
const SERVICES: Provider[] = [AuthService];
const GUARDS: Provider[] = [RolesGuard];

@Module({
  imports: [
    InfrastructureModule,
    PassportModule,
    ConfigModule,
    CqrsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'), // Use getOrThrow for required vars
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME', '3600s'),
        }, // Provide default
      }),
      inject: [ConfigService],
    }),
    // --- DO NOT import UserAppModule ---
  ],
  providers: [...SERVICES, ...STRATEGIES, ...GUARDS, ...RESOLVERS],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
