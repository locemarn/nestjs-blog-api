import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Credentials required for user login' })
export class LoginInput {
  // Allow login with either email or username for flexibility
  @Field({ description: "User's email address OR username" })
  @IsNotEmpty({ message: 'Email or Username is required' })
  @IsString()
  emailOrUsername: string;

  @Field({ description: "User's password" })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password format seems incorrect' })
  @IsString()
  // Optional: Add MinLength if desired, though primary validation happens in strategy
  password: string;
}
