import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/domain/user/entities/user.entity';
import { Identifier } from 'src/domain/shared/identifier';
import {
  USER_REPOSITORY_TOKEN,
  IUserRepository,
} from 'src/domain/user/repositories/user.repository.interface';

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined for JwtStrategy!');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // Passport automatically calls this with the decoded payload if signature is valid and token not expired
  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findById(
      Identifier.create(payload.sub),
    );
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
