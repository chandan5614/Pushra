import { Module } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { SlotsModule } from '../slots/slots.module'
import { RedisModule } from '../redis/redis.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PayTabsService } from './providers/paytabs.service'
import { StripeService } from './providers/stripe.service'
import { TestPaymentsService } from './providers/test.service'
import { WebhooksController } from './webhooks.controller'
import { DeliveriesModule } from '../deliveries/deliveries.module'

@Module({
  imports: [PrismaModule, SlotsModule, RedisModule, NotificationsModule, DeliveriesModule],
  providers: [PaymentsService, PayTabsService, StripeService, TestPaymentsService],
  controllers: [PaymentsController, WebhooksController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
