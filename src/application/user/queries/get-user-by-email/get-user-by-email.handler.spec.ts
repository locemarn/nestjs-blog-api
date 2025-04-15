import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role, User } from '../../../../domain/user/entities/user.entity';
import { UserOutputDto } from '../get-user-by-id/get-user-by-id.dto';
import { Identifier } from '../../../../domain/shared/identifier';
import { GetUserByEmailQueryHandler } from './get-user-by-email.handler';
import { GetUserByEmailQuery } from './get-user-by-email.query';
import { UserNotFoundException } from '../../../../domain/exceptions/domain.exceptions';

// --- Mocks ---
const mockUserRepository = { findByEmail: vi.fn() };
const mockUserMapper = { toDto: vi.fn() };

describe('GetUserByEmailQueryHandler', () => {
  let handler: GetUserByEmailQueryHandler;
  // let repository: IUserRepository;
  // let mapper: UserMapper;

  const userEntity = User.create(
    {
      email: 'test@ermail.com',
      password: 'hashed_password',
      username: 'username',
      role: Role.USER,
    },
    Identifier.create(1),
  );

  const userDto: UserOutputDto = {
    ...userEntity._props,
    id: +userEntity.id.Value,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // const moduleRef = await Test.createTestingModule({
    //   providers: [
    //     GetUserByEmailQueryHandler,
    //     UserMapper,
    //     { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
    //   ],
    // }).compile();

    handler = new GetUserByEmailQueryHandler(
      mockUserRepository as any,
      mockUserMapper as any,
    );
    // handler = moduleRef.get(GetUserByEmailQueryHandler);
    // repository = moduleRef.get(USER_REPOSITORY_TOKEN);
    // mapper = moduleRef.get(UserMapper);
  });

  it('should find user by email and return DTO', async () => {
    mockUserRepository.findByEmail.mockResolvedValueOnce(userEntity);
    const mapperSpy = vi
      .spyOn(mockUserMapper, 'toDto')
      .mockReturnValue(userDto);
    const query = new GetUserByEmailQuery(' tester@email.com ');

    const result = await handler.execute(query);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'tester@email.com',
    );
    expect(mapperSpy).toHaveBeenCalledWith(userEntity);
    expect(result).toEqual(userDto);
    mapperSpy.mockRestore();
  });

  it('should throw UserNotFoundException if user email does not exist', async () => {
    mockUserRepository.findByEmail.mockResolvedValueOnce(null);
    const mapperSpy = vi.spyOn(mockUserMapper, 'toDto');
    const query = new GetUserByEmailQuery(' notfound@email.com ');

    await expect(handler.execute(query)).rejects.toThrow(UserNotFoundException);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'notfound@email.com',
    );
    expect(mapperSpy).not.toHaveBeenCalled();
    mapperSpy.mockRestore();
  });
});
