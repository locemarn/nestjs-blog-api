import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user/entities/user.entity';
import { UserOutputDto } from '../queries/get-user-by-id/get-user-by-id.dto';

export const USER_MAPPER_TOKEN = Symbol('UserMapper');

@Injectable() // Make it injectable for dependency injection
export class UserMapper {
  /**
   * Maps a single User domain entity to a UserOutputDto.
   * @param entity The User entity.
   * @returns UserOutputDto A DTO safe for external exposure.
   */
  toDto(entity: User): UserOutputDto {
    if (!entity) {
      // Or throw an error, depending on desired behavior
      throw new Error('User entity is null or undefined'); // Ensure type safety by throwing an error
    }
    const dto = new UserOutputDto();
    if (entity.id && typeof entity.id === 'object' && 'Value' in entity.id) {
      Object.assign(dto, { id: (entity.id as { Value: number }).Value }); // Safely assign id using Object.assign
    } else {
      throw new Error('Invalid or missing identifier on User entity');
    }
    Object.defineProperty(dto, 'email', {
      value: entity.email,
      writable: false,
    });
    Object.defineProperty(dto, 'username', {
      value: entity.username,
      writable: false,
    });
    Object.defineProperty(dto, 'role', {
      value: entity.role,
      writable: false,
    });
    Object.defineProperty(dto, 'created_at', {
      value: entity._props.created_at,
      writable: false,
    });
    Object.defineProperty(dto, 'updated_at', {
      value: entity._props.updated_at,
      writable: false,
    });
    // Explicitly DO NOT map sensitive fields like passwordHash

    return dto;
  }

  /**
   * Maps an array of User domain entities to an array of UserOutputDtos.
   * @param entities Array of User entities.
   * @returns Array of UserOutputDtos.
   */
  toDtos(entities: User[] | null | undefined): UserOutputDto[] {
    if (!entities || entities.length === 0) {
      return [];
    }
    return entities.map((entity) => this.toDto(entity));
  }

  // You might add methods here later to map from DTOs back to Domain entities
  // or parts of entities if needed for updates, e.g., toDomainPropsFromUpdateDto()
}
