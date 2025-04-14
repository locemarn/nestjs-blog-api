import { Identifier } from 'src/domain/shared/identifier';
import { Role, User } from 'src/domain/user/entities/user.entity';
import { describe, beforeEach, it, expect } from 'vitest';
import { UserMapper } from './user.mapper';
import { UserOutputDto } from '../queries/get-user-by-id/get-user-by-id.dto';

describe('UserMapper', () => {
  let mapper: UserMapper;
  let userEntity: User;
  const userId = Identifier.create(123);
  const now = new Date();

  beforeEach(() => {
    mapper = new UserMapper();
    userEntity = User.create(
      {
        email: 'map@example.com',
        username: 'maptester',
        password: 'secret_hash', // This should NOT be in the DTO
        role: Role.ADMIN,
        created_at: now,
        updated_at: now,
      },
      userId,
    );
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('should map a User entity to a UserOutputDto', () => {
    const expectedDto: UserOutputDto = {
      id: +userId.Value,
      email: 'map@example.com',
      username: 'maptester',
      role: Role.ADMIN,
      created_at: now,
      updated_at: now,
    };

    const actualDto = mapper.toDto(userEntity);

    expect(actualDto).toBeInstanceOf(UserOutputDto);
    expect(actualDto).toEqual(expectedDto);
    // Explicitly check that passwordHash is NOT present
    expect(actualDto).not.toHaveProperty('passwordHash');
  });

  it('should handle multiple entities for toDtos', () => {
    const userEntity2 = User.create(
      {
        email: 'second@example.com',
        username: 'secondtester',
        password: 'another_secret_hash', // This should NOT be in the DTO
        role: Role.USER,
        created_at: now,
        updated_at: now,
      },
      Identifier.create(456),
    );
    const entities = [userEntity, userEntity2];

    const dtos = mapper.toDtos(entities);

    expect(dtos).toBeInstanceOf(Array);
    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe(userId.Value);
    expect(dtos[1].id).toBe(456);
    expect(dtos[0]).toBeInstanceOf(UserOutputDto);
  });

  it('should return an empty array if input to toDtos is empty or null', () => {
    expect(mapper.toDtos([])).toEqual([]);
    expect(mapper.toDtos(null)).toEqual([]);
    expect(mapper.toDtos(undefined)).toEqual([]);
  });
});
