import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { PayTabsService } from './providers/paytabs.service';
import { StripeService } from './providers/stripe.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
    private slots: SlotsService,
    private paytabs: PayTabsService,
    private stripe: StripeService,
  ) {}

  @Post('checkout/init')
  async initCheckout(
    @Req() req: any,
    @Body('items') items: { variantId: string; quantity: number }[],
    @Body('slotId') slotId: string,
    @Body('orderCode') orderCode?: string,
    @Body('email') email?: string,
  ) {
    // Determine user
    let userId = req.user?.sub as string | undefined;
    if (!userId) {
      if (!email) throw new Error('email required for guest checkout');
      const u = await this.prisma.user.upsert({ where: { email }, create: { email }, update: {} });
      userId = u.id;
    }

    const { orderId, amountCents, currency } = await this.payments.createOrderAndPayment({
      userId,
      items,
      slotId,
      orderCode,
    });

    const provider = this.payments.provider();
    if (provider === 'stripe') {
      const pi = await this.stripe.createPaymentIntent(amountCents, currency, { orderId });
      return { provider, orderId, amountCents, currency, clientSecret: pi.clientSecret, paymentIntentId: pi.id };
    } else {
      const session = await this.paytabs.createPayment(amountCents, currency, { orderId });
      return { provider, orderId, amountCents, currency, redirectUrl: session.redirectUrl, reference: session.reference };
    }
  }

  @Post('checkout/confirm')
  async confirmCheckout(
    @Body('provider') provider: 'stripe' | 'paytabs',
    @Body('orderId') orderId: string,
    @Body('paymentIntentId') paymentIntentId?: string,
    @Body('reference') reference?: string,
  ) {
    if (provider === 'stripe') {
      const ok = await this.stripe.confirmPayment(paymentIntentId!);
      if (!ok) throw new Error('Stripe confirmation failed');
      await this.payments.markPaid(orderId, paymentIntentId);
    } else {
      const ok = await this.paytabs.confirmPayment(reference!);
      if (!ok) throw new Error('PayTabs confirmation failed');
      await this.payments.markPaid(orderId, reference);
    }
    return { ok: true };
  }

  @Post('webhooks/paytabs')
  async paytabsWebhook(@Body() body: any, @Headers() headers: Record<string, string>) {
    const verified = await this.paytabs.verifyWebhook(body, headers);
    if (!verified) return { ok: false };
    const { orderId, reference } = this.paytabs.parseWebhook(body);
    await this.payments.markPaid(orderId, reference);
    return { ok: true };
  }

  @Post('webhooks/stripe')
  async stripeWebhook(@Body() body: any, @Headers('stripe-signature') sig: string) {
    const event = await this.stripe.verifyWebhook(body, sig);
    if (!event) return { ok: false };
    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data.object.metadata?.orderId as string;
      const id = event.data.object.id as string;
      if (orderId) await this.payments.markPaid(orderId, id);
    }
    return { ok: true };
  }
}

