import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from 'src/auth/services/auth.service';
import { AuthPayloadDto } from './dto/auth-payload.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginInput } from './dto/login.input';
import { RegisterInputDto } from './dto/register.input';
import { Role } from 'src/domain/user/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  // Use LocalAuthGuard to trigger LocalStrategy validation
  @UseGuards(LocalAuthGuard) // Apply the guard
  @Mutation(() => AuthPayloadDto)
  async login(
    // Args decorator gets input from GraphQL request
    @Args('input') input: LoginInput,
    @Context()
    context: {
      req: Request & {
        user: Omit<
          {
            password: string;
            email: string;
            username: string;
            role: Role;
            id: number;
            created_at: Date;
            updated_at: Date;
          },
          'password'
        >;
      };
    },
  ): Promise<AuthPayloadDto> {
    // LocalAuthGuard runs LocalStrategy.validate. If successful, context.req.user contains the validated user object.
    // We just need to call the login service to generate the JWT.
    return this.authService.login(context.req.user);
  }

  @Mutation(() => AuthPayloadDto)
  async register(
    @Args('input') input: RegisterInputDto,
  ): Promise<AuthPayloadDto> {
    const registerDto = {
      email: input.email,
      username: input.username,
      password: input.password,
      role: input.role,
    };
    return this.authService.register(registerDto);
  }
}
