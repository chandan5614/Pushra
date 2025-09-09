import { Injectable } from '@nestjs/common'

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, body: string) {
    // Stub: integrate real email later; log minimal content
    const snippet = String(body || '').slice(0, 60)
    console.log(`[notifications] email -> ${to}: ${subject} :: ${snippet}`)
  }

  async sendAssigned(orderId: string, trackingLink?: string) {
    console.log(`[notifications] assigned order=${orderId} track=${trackingLink || ''}`)
  }

  async sendOutForDelivery(orderId: string, trackingLink?: string) {
    console.log(`[notifications] out_for_delivery order=${orderId} track=${trackingLink || ''}`)
  }

  async sendDelivered(orderId: string) {
    console.log(`[notifications] delivered order=${orderId}`)
  }
}
