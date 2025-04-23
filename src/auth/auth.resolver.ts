import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from 'src/auth/services/auth.service';
import { AuthPayloadDto } from './dto/auth-payload.dto';
import { LoginInput } from './dto/login.input';
import { RegisterInputDto } from './dto/register.input';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByEmailQuery } from 'src/application/user/queries/get-user-by-email/get-user-by-email.query';
import { UserOutputDto } from 'src/application/user/queries/get-user-by-id/get-user-by-id.dto';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private readonly queryBus: QueryBus,
  ) {}

  // Use LocalAuthGuard to trigger LocalStrategy validation
  // @UseGuards(LocalAuthGuard) // Apply the guard
  @Mutation(() => AuthPayloadDto)
  async login(
    // Args decorator gets input from GraphQL request
    @Args('input') input: LoginInput,
  ): Promise<AuthPayloadDto> {
    const user = await this.queryBus.execute<
      GetUserByEmailQuery,
      UserOutputDto | null
    >(new GetUserByEmailQuery(input.email));
    console.log('akiii', user);
    if (!user || !user.email || !user.username || !user.role || !user.id) {
      throw new Error('Invalid user data');
    }
    return this.authService.login({
      email: user.email,
      username: user.username,
      role: user.role,
      id: user.id,
      created_at: user.created_at || new Date(),
      updated_at: user.updated_at || new Date(),
    });
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
