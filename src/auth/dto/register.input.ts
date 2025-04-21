import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from 'src/domain/user/entities/user.entity';

@InputType({ description: 'Data required for a new user to register' })
export class RegisterInputDto {
  @Field()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(50)
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @Field()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  // Add password complexity validation if needed (e.g., using @Matches)
  password: string;

  // Optional: Allow specifying role during registration?
  // Usually, registration defaults to USER role for security.
  // If you allow specifying role, add strong authorization checks later.
  // Let's make it optional and default to USER.
  @Field(() => Role, {
    nullable: false,
    description: 'Optional role (defaults to USER)',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.USER;
}
