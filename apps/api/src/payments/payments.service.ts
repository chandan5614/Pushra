import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SlotsService } from '../slots/slots.service'
import { DomainEvents } from '../events/domain-events.service'
import { PaymentStatus } from '@prisma/client'

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private slots: SlotsService,
    private events: DomainEvents,
  ) {}

  provider(): 'stripe' | 'paytabs' | 'test' {
    if (process.env.ALLOW_TEST_PAYMENTS === 'true') return 'test'
    const prefer = (process.env.PAYMENT_PROVIDER || '').toLowerCase()
    if (prefer === 'stripe' || prefer === 'paytabs') return prefer as any
    if (process.env.PAYTABS_SERVER_KEY) return 'paytabs'
    if (process.env.STRIPE_SECRET_KEY) return 'stripe'
    return 'test'
  }

  async computeTotals(items: { variantId: string; quantity: number }[]) {
    let amountCents = 0
    const currency = 'AED'
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
    })
    const byId = new Map(variants.map((v) => [v.id, v] as const))
    for (const item of items) {
      const v = byId.get(item.variantId)
      if (!v) throw new Error(`Variant not found: ${item.variantId}`)
      amountCents += v.priceCents * item.quantity
    }
    // TAX 5%
    const tax = Math.round(amountCents * 0.05)
    amountCents += tax
    return { amountCents, currency }
  }

  async createOrderAndPayment(params: {
    userId: string
    items: { variantId: string; quantity: number }[]
    slotId: string
    orderCode?: string
    idempotencyKey: string
  }) {
    const { userId, items, slotId, idempotencyKey } = params
    const { amountCents, currency } = await this.computeTotals(items)

    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: { userId } })
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant) throw new Error('Variant missing')
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productVariantId: variant.id,
            quantity: item.quantity,
            unitPriceCents: variant.priceCents,
          },
        })
      }
      await tx.payment.upsert({
        where: { idempotencyKey },
        update: { orderId: order.id, amountCents, currency },
        create: {
          orderId: order.id,
          amountCents,
          currency,
          status: PaymentStatus.PENDING,
          provider: this.provider(),
          idempotencyKey,
        },
      })
      return order
    })

    // Lock slot with hold keyed by orderCode or order.id
    const orderCode = params.orderCode || idempotencyKey || order.id
    await this.slots.reserveSlot(orderCode, slotId)
    const payment = await this.prisma.payment.findUnique({ where: { orderId: order.id } })
    return { orderId: order.id, amountCents, currency, paymentId: payment!.id }
  }

  async markPaidByOrder(orderId: string, intentId?: string, raw?: any) {
    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.PAID, intentId, raw },
    })
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' as any } })
    this.events.emit('order_confirmed', { orderId })
    return payment
  }

  async markFailedByOrder(orderId: string, raw?: any) {
    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.FAILED, raw },
    })
    // Release slot hold keyed by orderId if present
    await this.slots.releaseSlot(orderId)
    return payment
  }

  async markPaidById(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PAID },
    })
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CONFIRMED' as any },
    })
    this.events.emit('order_confirmed', { orderId: payment.orderId })
    return payment
  }
}
