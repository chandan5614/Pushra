import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, body: string) {
    // Stub: integrate real email later
    console.log(`[notifications] email -> ${to}: ${subject}`);
  }
}

