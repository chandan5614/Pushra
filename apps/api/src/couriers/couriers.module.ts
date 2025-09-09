import { Module } from '@nestjs/common'
import { CouriersController } from './couriers.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [CouriersController],
  providers: [PrismaService],
  exports: [],
})
export class CouriersModule {}

