import { Injectable } from '@nestjs/common';

@Injectable()
export class PayTabsService {
  async createPayment(amountCents: number, currency: string, params: { orderId: string; returnUrl?: string; callbackUrl?: string }) {
    // Placeholder: integrate with PayTabs API. For now, synthesize a redirect URL.
    const reference = `PT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const redirectUrl = `${process.env.PAYTABS_BASE_URL || 'https://secure.paytabs.com'}/pay/${reference}`
    return { reference, redirectUrl }
  }

  async confirmPayment(reference: string) {
    // Placeholder: call PayTabs API to confirm if needed
    return !!reference;
  }

  async verifyWebhook(body: any, headers: Record<string, string>) {
    // Placeholder signature verification using server key
    const serverKey = process.env.PAYTABS_SERVER_KEY || '';
    if (!serverKey) return true; // skip in dev
    // TODO: implement proper signature validation per PayTabs docs
    return Boolean(headers['x-signature'] || headers['X-Signature']);
  }

  parseWebhook(body: any): { orderId: string; reference: string; status: 'authorized' | 'paid' | 'failed' | 'canceled' } {
    // Map body to our fields; adjust to real PayTabs schema later
    const orderId = body?.order_id || body?.orderId || body?.metadata?.orderId
    const reference = body?.transaction_reference || body?.reference || body?.id
    const code = (body?.response_code || body?.status || '').toString()
    let status: 'authorized' | 'paid' | 'failed' | 'canceled' = 'failed'
    if (code === 'A') status = 'authorized'
    if (code === 'Y') status = 'paid'
    if (code === 'C') status = 'canceled'
    return { orderId, reference, status }
  }
}
