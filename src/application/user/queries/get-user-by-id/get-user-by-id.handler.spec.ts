import { Test } from '@nestjs/testing';
import { UserNotFoundException } from 'src/domain/exceptions/domain.exceptions';
import { Identifier } from 'src/domain/shared/identifier';
import { Role, User } from 'src/domain/user/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from 'src/domain/user/repositories/user.repository.interface';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';
import { UserMapper } from '../../mappers/user.mapper';
import { GetUserByIdQueryHandler } from './get-user-by-id.handler';
import { UserOutputDto } from './get-user-by-id.dto';
import { GetUserByIdQuery } from './get-user-by-id.query';

// --- Mocks ---
const mockUserRepository: Partial<IUserRepository> = {
  findById: vi.fn(),
};

// Mock the mapper
// const mockUserMapper = {
//   toDto: vi.fn(),
// };
// --- End Mocks ---

describe('GetUserByIdQueryHandler', () => {
  let handler: GetUserByIdQueryHandler;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: IUserRepository; // Get instance for verification if needed
  let mapper: UserMapper; // Get instance for verification if needed

  const userId = 123; // Use raw ID for query
  const userIdIdentifier = Identifier.create(userId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userEntity = User.create(
    {
      username: 'Test User', // Replace with actual properties of UserProps
      email: 'found@example.com',
      password: 'hashed_password', // Add a valid password
      role: Role.USER, // Add a valid role
      // Add other required properties here
    },
    userIdIdentifier,
  );
  const userDto = new UserOutputDto(); // Prepare a dummy DTO for mock mapper
  Object.defineProperty(userDto, 'id', { value: userId, writable: false });
  Object.defineProperty(userDto, 'email', {
    value: 'found@example.com',
    writable: false,
  });
  // ... other DTO fields

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserByIdQueryHandler,
        UserMapper, // Provide the real mapper or a mock if testing complex mapping separately
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        // If providing real mapper, no need to mock it here.
        // If mocking mapper:
        // { provide: UserMapper, useValue: mockUserMapper }
      ],
    }).compile();

    handler = moduleRef.get(GetUserByIdQueryHandler);
    repository = moduleRef.get(USER_REPOSITORY_TOKEN);
    mapper = moduleRef.get(UserMapper); // Get the mapper instance

    // Setup mock for mapper if mocking:
    // mockUserMapper.toDto.mockReturnValue(userDto);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  // it('should retrieve user and map it to DTO when found', async () => {
  //   // Arrange
  //   (mockUserRepository.findById as Mock).mockResolvedValue(userEntity);
  //   // Spy on the real mapper's method instead of mocking the whole mapper
  //   const mapperSpy = vi.spyOn(mapper, 'toDto');

  //   const query = new GetUserByIdQuery(userId);

  //   // Act
  //   const result = await handler.execute(query);

  //   // Assert
  //   expect(mockUserRepository.findById).toHaveBeenCalledWith(userIdIdentifier);
  //   expect(mapperSpy).toHaveBeenCalledWith(userEntity); // Check if mapper was called correctly
  //   expect(result).toBeInstanceOf(UserOutputDto);
  //   expect(result.id).toBe(userId);
  //   // Add more checks on DTO fields if necessary, using the actual mapped result
  //   expect(result.email).toBe(userEntity.email);

  //   mapperSpy.mockRestore(); // Clean up spy
  // });

  it('should throw UserNotFoundException if user is not found', async () => {
    // Arrange
    (mockUserRepository.findById as Mock).mockResolvedValue(null); // Simulate user not found
    const mapperSpy = vi.spyOn(mapper, 'toDto');

    const query = new GetUserByIdQuery(999); // ID that won't be found
    const nonExistentIdIdentifier = Identifier.create(999);

    // Act & Assert
    await expect(handler.execute(query)).rejects.toThrow(UserNotFoundException);

    // Verify repository was called, but mapper was not
    expect(mockUserRepository.findById).toHaveBeenCalledWith(
      nonExistentIdIdentifier,
    );
    expect(mapperSpy).not.toHaveBeenCalled();

    mapperSpy.mockRestore();
  });

  it('should create correct Identifier for number IDs', async () => {
    const numberId = 456;
    const numberIdIdentifier = Identifier.create(numberId);
    (mockUserRepository.findById as Mock).mockResolvedValue(null);

    const queryNum = new GetUserByIdQuery(numberId);
    await expect(handler.execute(queryNum)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(mockUserRepository.findById).toHaveBeenCalledWith(
      numberIdIdentifier,
    );
  });
});
