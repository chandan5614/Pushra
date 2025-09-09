import { Body, Controller, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { PayTabsService } from './providers/paytabs.service';
import { StripeService } from './providers/stripe.service';
import { TestPaymentsService } from './providers/test.service';
// JwtAuthGuard imported elsewhere where needed; not used here
import { z } from 'zod'

@Controller()
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
    private slots: SlotsService,
    private paytabs: PayTabsService,
    private stripe: StripeService,
    private testPay: TestPaymentsService,
  ) {}

  private rate = new Map<string, { count: number; ts: number }>()

  @Post('checkout/init')
  async initCheckout(
    @Req() req: any,
  @Body() body: any,
  ) {
    // Simple rate limit per IP per minute: max 10
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'ip'
    const now = Date.now()
    const ent = this.rate.get(ip) || { count: 0, ts: now }
    if (now - ent.ts > 60_000) { ent.count = 0; ent.ts = now }
    ent.count++
    this.rate.set(ip, ent)
    if (ent.count > 10) { return { ok: false, error: 'rate_limited' } }

    const schema = z.object({
      cart: z.object({ items: z.array(z.object({ variantId: z.string(), qty: z.number().int().positive(), sku: z.string().optional(), addons: z.any().optional() })) }),
      slotId: z.string(),
      city: z.string().default('al-ain'),
      idempotencyKey: z.string().min(8),
      email: z.string().email().optional(),
      orderCode: z.string().optional(),
    })
    const parsed = schema.parse(body)
    const items = parsed.cart.items.map(i => ({ variantId: i.variantId, quantity: i.qty }))
    const slotId = parsed.slotId
    const orderCode = parsed.orderCode
    const email = parsed.email

    // Determine user
    let userId = req.user?.sub as string | undefined;
    if (!userId) {
      if (!email) throw new Error('email required for guest checkout');
      const u = await this.prisma.user.upsert({ where: { email }, create: { email }, update: {} });
      userId = u.id;
    }

    const { orderId, amountCents, currency, paymentId } = await this.payments.createOrderAndPayment({
      userId,
      items,
      slotId,
      orderCode,
      idempotencyKey: parsed.idempotencyKey,
    });

    const provider = this.payments.provider();
    if (provider === 'stripe') {
      const pi = await this.stripe.createPaymentIntent(amountCents, currency, { orderId });
      return { provider, orderId, orderCode: orderId, amountCents, currency, clientSecret: pi.clientSecret, paymentId };
    } else {
      if (provider === 'paytabs') {
        const base = process.env.PUBLIC_WEB_URL || 'http://localhost:3000'
        const returnUrl = `${base}/checkout/return`
        const callbackUrl = `${process.env.PUBLIC_API_URL || 'http://localhost:3001'}/webhooks/paytabs`
        const session = await this.paytabs.createPayment(amountCents, currency, { orderId, returnUrl, callbackUrl })
        return { provider, orderId, orderCode: orderId, amountCents, currency, redirectUrl: session.redirectUrl, paymentId }
      } else {
        const res = await this.testPay.createPayment({ amountCents, currency, paymentId: paymentId! })
        return { provider, orderId, orderCode: orderId, amountCents, currency, redirectUrl: res.redirectUrl, paymentId }
      }
    }
  }

  @Post('checkout/confirm')
  async confirmCheckout(
    @Body('provider') provider: 'stripe' | 'paytabs' | 'test',
    @Body('orderId') orderId: string,
    @Body('paymentIntentId') paymentIntentId?: string,
    @Body('reference') reference?: string,
  ) {
    if (provider === 'stripe') {
      const ok = await this.stripe.confirmPayment(paymentIntentId!);
      if (!ok) throw new Error('Stripe confirmation failed');
      await this.payments.markPaidByOrder(orderId, paymentIntentId);
    } else {
      if (provider === 'paytabs') {
        const ok = await this.paytabs.confirmPayment(reference!);
        if (!ok) throw new Error('PayTabs confirmation failed');
        await this.payments.markPaidByOrder(orderId, reference);
      } else {
        await this.payments.markPaidByOrder(orderId);
      }
    }
    return { ok: true };
  }

  // Webhooks moved to WebhooksController
}
