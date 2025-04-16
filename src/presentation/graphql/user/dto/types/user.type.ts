import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from 'src/domain/user/entities/user.entity';

registerEnumType(Role, {
  name: 'Role',
  description: 'User roles (USER, ADMIN, etc.)',
});

@ObjectType('User')
export class UserType {
  @Field(() => ID, { description: 'Unique identifier for the user' })
  id: number;

  @Field({ description: "User's unique email address" })
  email: string;

  @Field({ description: "User's unique username" })
  username: string;

  // @Field({ description: "User's password" })
  // password: string;

  @Field(() => Role, { description: "User's assigned role" })
  role: Role;

  @Field({ description: 'Timestamp when the user was created' })
  created_at: Date;

  @Field({ description: 'Timestamp when the user was last updated' })
  updated_at: Date;
}
