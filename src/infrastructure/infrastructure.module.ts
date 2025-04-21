import { Module } from '@nestjs/common';
import { PrismaModule } from './persistence/prisma/prisma.module'; // Needed to make PrismaService globally available
import { BcryptPasswordHasher } from './hashing/bcrypt-password-hasher';
import { PASSWORD_HASHER_TOKEN } from 'src/application/user/shared/interfaces/password-hasher.interface';
import { USER_REPOSITORY_TOKEN } from 'src/domain/user/repositories/user.repository.interface';
import { PrismaUserRepository } from './persistence/repositories/prisma-user.repository';
import { POST_REPOSITORY_TOKEN } from 'src/domain/post/repositories/post.repository.interface';
import { PrismaPostRepository } from './persistence/repositories/prisma-post.repository';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    {
      provide: POST_REPOSITORY_TOKEN,
      useClass: PrismaPostRepository,
    },
  ],
  exports: [
    PASSWORD_HASHER_TOKEN,
    USER_REPOSITORY_TOKEN,
    POST_REPOSITORY_TOKEN,
  ],
})
export class InfrastructureModule {}
