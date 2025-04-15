import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByEmailQuery } from './get-user-by-email.query';
import { UserOutputDto } from '../get-user-by-id/get-user-by-id.dto';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../../domain/user/repositories/user.repository.interface';
import { UserMapper } from '../../mappers/user.mapper';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailQueryHandler
  implements IQueryHandler<GetUserByEmailQuery, UserOutputDto>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<UserOutputDto> {
    const normalizedEmail = query.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UserNotFoundException(`Email: ${query.email}`);
    }
    return this.userMapper.toDto(user);
  }
}
