import { Body, Controller, Get, Headers, Query, Post } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { StripeService } from './providers/stripe.service'
import { PayTabsService } from './providers/paytabs.service'

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private payments: PaymentsService,
    private stripe: StripeService,
    private paytabs: PayTabsService,
  ) {}

  @Get('test')
  async testPaid(@Query('pid') pid: string) {
    if (!pid) return { ok: false }
    await this.payments.markPaidById(pid)
    return { ok: true }
  }

  @Post('stripe')
  async stripeWebhook(@Body() body: any, @Headers('stripe-signature') sig: string) {
    const event = await this.stripe.verifyWebhook(body, sig)
    if (!event) return { ok: false }
    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data.object.metadata?.orderId as string
      const id = event.data.object.id as string
      await this.payments.markPaidByOrder(orderId, id, body)
    }
    if (event.type === 'payment_intent.payment_failed') {
      const orderId = event.data.object.metadata?.orderId as string
      await this.payments.markFailedByOrder(orderId, body)
    }
    return { ok: true }
  }

  @Post('paytabs')
  async paytabsWebhook(@Body() body: any, @Headers() headers: Record<string, string>) {
    const verified = await this.paytabs.verifyWebhook(body, headers)
    if (!verified) return { ok: false }
    const { orderId, reference, status } = this.paytabs.parseWebhook(body)
    if (status === 'paid' || status === 'authorized') {
      await this.payments.markPaidByOrder(orderId, reference, body)
    } else if (status === 'failed' || status === 'canceled') {
      await this.payments.markFailedByOrder(orderId, body)
    }
    return { ok: true }
  }
}
