import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Make PrismaService available everywhere without importing PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export so it can be used by repositories, etc.
})
export class PrismaModule {}
