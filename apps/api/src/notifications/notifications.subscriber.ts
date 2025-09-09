import { Injectable, OnModuleInit } from '@nestjs/common'
import { DomainEvents } from '../events/domain-events.service'
import { EmailService } from './email.service'
import { WhatsAppService } from './whatsapp.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsSubscriber implements OnModuleInit {
  constructor(
    private events: DomainEvents,
    private email: EmailService,
    private wa: WhatsAppService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.events.on('order_confirmed', async ({ orderId }) => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, delivery: true },
      })
      const to = order?.user?.email
      const base = process.env.PUBLIC_WEB_URL || 'http://localhost:3000'
      const code = order?.delivery?.code
      const track = code ? `${base}/t/${code}` : `${base}`
      if (to) {
        await this.email.send(
          to,
          'Order confirmed',
          `Order ${orderId} has been confirmed. Track: ${track}`,
        )
      }
      // If we had phone numbers we'd send WA template too
    })

    this.events.on('out_for_delivery', async ({ orderId }) => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      })
      const to = order?.user?.email
      if (to) await this.email.send(to, 'Out for delivery', `Order ${orderId} is on the way.`)
    })

    this.events.on('delivered', async ({ orderId }) => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      })
      const to = order?.user?.email
      if (to) await this.email.send(to, 'Delivered', `Order ${orderId} has been delivered.`)
    })
  }
}
