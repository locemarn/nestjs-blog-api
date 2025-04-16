import { Module } from '@nestjs/common';
import { PrismaModule } from './persistence/prisma/prisma.module'; // Needed to make PrismaService globally available
import { BcryptPasswordHasher } from './hashing/bcrypt-password-hasher';
import { PASSWORD_HASHER_TOKEN } from 'src/application/user/shared/interfaces/password-hasher.interface';
// --- We will import PrismaUserRepository HERE in the next step ---
// import { PrismaUserRepository } from './persistence/repositories/prisma-user.repository';

@Module({
  imports: [
    PrismaModule, // Ensure PrismaModule is imported (even if global, explicit import doesn't hurt)
  ],
  providers: [
    // Provide the concrete BcryptPasswordHasher when IPasswordHasher is requested
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
    // --- We will add the UserRepository provider HERE in the next step ---
    // {
    //   provide: USER_REPOSITORY_TOKEN,
    //   useClass: PrismaUserRepository,
    // },
    // Add providers for other repositories (Post, Comment, etc.) here later
  ],
  exports: [
    // Export the tokens so other modules can import InfrastructureModule and use them
    PASSWORD_HASHER_TOKEN,
    // USER_REPOSITORY_TOKEN, // Export this when added above
    // Export other tokens as needed
  ],
})
export class InfrastructureModule {}
