import { Injectable } from '@nestjs/common';

type StripeEvent = {
  type: string;
  data: { object: any };
};

@Injectable()
export class StripeService {
  async createPaymentIntent(amountCents: number, currency: string, metadata: Record<string, any>) {
    // Placeholder: Do not call Stripe SDK; return mock id and client secret
    const id = `pi_${Math.random().toString(36).slice(2)}`;
    const clientSecret = `${id}_secret_${Math.random().toString(36).slice(2)}`;
    return { id, clientSecret, metadata };
  }

  async confirmPayment(paymentIntentId: string) {
    // Placeholder: pretend confirmation succeeded
    return !!paymentIntentId;
  }

  async verifyWebhook(body: any, signature: string | undefined): Promise<StripeEvent | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return body as StripeEvent; // dev mode passthrough
    if (!signature) return null;
    // TODO: implement real signature verification
    return body as StripeEvent;
  }
}

