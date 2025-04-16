import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail } from 'class-validator';

@ArgsType()
export class GetUserByEmailArgs {
  @Field()
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  email: string;
}
