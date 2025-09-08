import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationsSubscriber } from './notifications.subscriber';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EventsModule, PrismaModule],
  providers: [NotificationsService, EmailService, WhatsAppService, NotificationsSubscriber],
  exports: [NotificationsService, EmailService, WhatsAppService],
})
export class NotificationsModule {}
