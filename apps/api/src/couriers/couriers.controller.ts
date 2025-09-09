import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AdminGuard } from '../auth/admin.guard'

@Controller()
export class CouriersController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/admin/couriers')
  list() {
    return this.prisma.courier.findMany({ orderBy: { createdAt: 'desc' }})
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/admin/couriers')
  create(@Body() body: { name: string; email: string; phone?: string }) {
    return this.prisma.courier.create({ data: { ...body, status: 'AVAILABLE' }})
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('/admin/couriers/:id')
  update(
    @Param('id') id: string,
    @Body() body: { status?: 'AVAILABLE'|'ON_DUTY'|'INACTIVE'; name?: string; phone?: string },
  ) {
    return this.prisma.courier.update({ where: { id }, data: body })
  }

  // Simple login (dev)
  @Post('/courier/login')
  async login(@Body() body: { email: string }) {
    const c = await this.prisma.courier.findUnique({ where: { email: body.email }})
    if (!c) return { ok: false }
    // For now return a stub token hint; real flow uses magic link
    return { ok: true, courierId: c.id }
  }
}
