import { Injectable } from '@nestjs/common'

@Injectable()
export class TestPaymentsService {
  async createPayment(params: { amountCents: number; currency: string; paymentId: string }) {
    const base = process.env.PUBLIC_WEB_URL || 'http://localhost:3000'
    const redirectUrl = `${base}/checkout/success?test=1&pid=${encodeURIComponent(params.paymentId)}`
    return { redirectUrl }
  }
}

