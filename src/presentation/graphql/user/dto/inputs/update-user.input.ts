import { InputType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { Role } from 'src/domain/user/entities/user.entity';

@InputType({
  description:
    'Data for updating an existing user (provide only fields to change)',
})
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(50)
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  // Password updates often handled via a separate mutation (e.g., changePassword) for clarity/security
  // We will omit password update from this generic update input for now.

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
