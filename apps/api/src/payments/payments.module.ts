import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SlotsModule } from '../slots/slots.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PayTabsService } from './providers/paytabs.service';
import { StripeService } from './providers/stripe.service';

@Module({
  imports: [PrismaModule, SlotsModule, RedisModule, NotificationsModule],
  providers: [PaymentsService, PayTabsService, StripeService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
