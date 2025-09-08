import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const orders = await this.prisma.order.findMany({
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return orders
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('status') status: string) {
    const allowed = new Set(['CONFIRMED', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
    if (!allowed.has(status)) return { ok: false, message: 'invalid status' }
    const order = await this.prisma.order.update({ where: { id }, data: { status: status as any } })
    return { ok: true, order }
  }
}

