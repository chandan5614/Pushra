import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { DomainEvents } from '../events/domain-events.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private slots: SlotsService,
    private events: DomainEvents,
  ) {}

  provider(): 'stripe' | 'paytabs' {
    const prefer = (process.env.PAYMENT_PROVIDER || '').toLowerCase();
    if (prefer === 'stripe' || prefer === 'paytabs') return prefer as any;
    // Auto-pick if keys present
    if (process.env.STRIPE_SECRET_KEY) return 'stripe';
    return 'paytabs';
  }

  async computeTotals(items: { variantId: string; quantity: number }[]) {
    let amountCents = 0;
    const currency = 'USD';
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
    });
    const byId = new Map(variants.map((v) => [v.id, v] as const));
    for (const item of items) {
      const v = byId.get(item.variantId);
      if (!v) throw new Error(`Variant not found: ${item.variantId}`);
      amountCents += v.priceCents * item.quantity;
    }
    return { amountCents, currency };
  }

  async createOrderAndPayment(params: {
    userId: string;
    items: { variantId: string; quantity: number }[];
    slotId: string;
    orderCode?: string;
  }) {
    const { userId, items, slotId } = params;
    const { amountCents, currency } = await this.computeTotals(items);

    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: { userId } });
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) throw new Error('Variant missing');
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productVariantId: variant.id,
            quantity: item.quantity,
            unitPriceCents: variant.priceCents,
          },
        });
      }
      await tx.payment.create({
        data: {
          orderId: order.id,
          amountCents,
          currency,
          status: PaymentStatus.PENDING,
          provider: this.provider(),
        },
      });
      return order;
    });

    // Lock slot with hold keyed by orderCode or order.id
    const orderCode = params.orderCode || order.id;
    await this.slots.reserveSlot(orderCode, slotId);
    return { orderId: order.id, amountCents, currency };
  }

  async markPaid(orderId: string, transactionId?: string) {
    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.SUCCEEDED, transactionId },
    });
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' as any } });
    // Emit domain event
    this.events.emit('order_confirmed', { orderId });
    return payment;
  }
}
