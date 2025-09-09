import { Controller, Get, Query } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('orders')
export class OrdersPublicController {
  constructor(private prisma: PrismaService) {}

  // Public status endpoint for quick confirmation by order code (order id)
  @Get('status')
  async status(@Query('code') code?: string) {
    if (!code) return { ok: false, error: 'missing_code' }
    const order = await this.prisma.order.findUnique({ where: { id: code }, include: { payment: true } })
    if (!order) return { ok: false, error: 'not_found' }
    return {
      ok: true,
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.payment?.status ?? null,
        createdAt: order.createdAt,
      },
    }
  }
}

