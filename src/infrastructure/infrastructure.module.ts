import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from './persistence/prisma/prisma.module'; // Needed to make PrismaService globally available
import { BcryptPasswordHasher } from './hashing/bcrypt-password-hasher';
import { PASSWORD_HASHER_TOKEN } from 'src/application/user/shared/interfaces/password-hasher.interface';
import { USER_REPOSITORY_TOKEN } from 'src/domain/user/repositories/user.repository.interface';
import { PrismaUserRepository } from './persistence/repositories/prisma-user.repository';
import { POST_REPOSITORY_TOKEN } from 'src/domain/post/repositories/post.repository.interface';
import { PrismaPostRepository } from './persistence/repositories/prisma-post.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { CATEGORY_REPOSITORY_TOKEN } from 'src/domain/category/repositories/category.repository.interface';
import { PrismaCategoryRepository } from './persistence/repositories/prisma-category.repository';
import { COMMENT_REPOSITORY_TOKEN } from 'src/domain/comment/repositories/comment.repository.interface';

const infrastructureProviders: Provider[] = [
  { provide: PASSWORD_HASHER_TOKEN, useClass: BcryptPasswordHasher },
  { provide: USER_REPOSITORY_TOKEN, useClass: PrismaUserRepository },
  { provide: POST_REPOSITORY_TOKEN, useClass: PrismaPostRepository },
  { provide: CATEGORY_REPOSITORY_TOKEN, useClass: PrismaCategoryRepository },
  {
    provide: COMMENT_REPOSITORY_TOKEN,
    useValue: {
      saveComment: (comment) => comment as unknown,
      update: (comment) => comment as unknown,
      delete: (id) => id as unknown,
      findById: (id) => id as unknown,
      getComments: (limit: number, offset: number) => [{ limit, offset }],
    },
  },
];

const exportedTokens = [
  PASSWORD_HASHER_TOKEN,
  USER_REPOSITORY_TOKEN,
  POST_REPOSITORY_TOKEN,
  CATEGORY_REPOSITORY_TOKEN,
  COMMENT_REPOSITORY_TOKEN,
];

@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [...infrastructureProviders],
  exports: [...exportedTokens],
})
export class InfrastructureModule {}
