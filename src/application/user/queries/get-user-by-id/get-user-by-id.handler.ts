import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { UserNotFoundException } from 'src/domain/exceptions/domain.exceptions';
import { Identifier } from 'src/domain/shared/identifier';
import {
  USER_REPOSITORY_TOKEN,
  IUserRepository,
} from 'src/domain/user/repositories/user.repository.interface';
import { UserMapper } from '../../mappers/user.mapper';
import { UserOutputDto } from './get-user-by-id.dto';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery, UserOutputDto>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper, // Inject the mapper
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserOutputDto> {
    // 1. Create the Domain Identifier from the query parameter
    const userId = Identifier.create(query.userId);

    // 2. Fetch the domain entity using the repository
    const user = await this.userRepository.findById(userId);

    // 3. Handle case where user is not found
    if (!user) {
      // Let the specific domain exception bubble up.
      // The presentation layer (GraphQL resolver) can catch this and return appropriate GraphQL error.
      throw new UserNotFoundException(`ID: ${query.userId}`);
    }

    // 4. Map the domain entity to the Output DTO using the mapper
    console.log('this.userMapper ---->', UserMapper);
    const userDto = this.userMapper.toDto(user);

    // 5. Return the DTO
    return userDto;
  }
}
