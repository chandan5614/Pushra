import { Module } from '@nestjs/common'
import { DeliveriesService } from './deliveries.service'
import { DeliveriesController } from './deliveries.controller'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Module({
  providers: [DeliveriesService, PrismaService, NotificationsService],
  controllers: [DeliveriesController],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}

