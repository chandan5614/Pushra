import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, body: string) {
    // Stub: integrate real email later; log minimal content
    const snippet = String(body || '').slice(0, 60)
    console.log(`[notifications] email -> ${to}: ${subject} :: ${snippet}`)
  }
}
