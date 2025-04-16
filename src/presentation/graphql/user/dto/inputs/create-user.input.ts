import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from 'src/domain/user/entities/user.entity';

@InputType({ description: 'Data required to create a new user' })
export class CreateUserInput {
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
  password: string;

  @Field(() => Role, { nullable: true, defaultValue: Role.USER }) // Optional in schema, defaults to USER
  @IsOptional()
  @IsEnum(Role)
  role: Role = Role.USER;
}
