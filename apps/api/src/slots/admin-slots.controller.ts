import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SlotsService } from './slots.service'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AdminGuard } from '../auth/admin.guard'

function parseWindow(window: string) {
  // Accept "10-14" or "10:00-14:00"
  const m = window.match(/^(\d{1,2})(?::?(\d{2}))?-(\d{1,2})(?::?(\d{2}))?$/)
  if (!m) throw new Error('Invalid window format')
  const [, h1, m1, h2, m2] = m
  return {
    startHour: parseInt(h1, 10),
    startMin: m1 ? parseInt(m1, 10) : 0,
    endHour: parseInt(h2, 10),
    endMin: m2 ? parseInt(m2, 10) : 0,
  }
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/slots')
export class AdminSlotsController {
  constructor(
    private prisma: PrismaService,
    private slots: SlotsService,
  ) {}

  @Put()
  async upsert(
    @Body('date') date: string,
    @Body('city') city: string,
    @Body('window') window: string,
    @Body('capacity') capacity?: number,
    @Body('cutoffAt') cutoffAt?: string | null,
  ) {
    if (!date || !city || !window) {
      return { ok: false, message: 'date, city and window are required' }
    }
    const { startHour, startMin, endHour, endMin } = parseWindow(window)
    const [y, m, d] = date.split('-').map((s) => parseInt(s, 10))
    const start = new Date(y, m - 1, d, startHour, startMin, 0, 0)
    const end = new Date(y, m - 1, d, endHour, endMin, 0, 0)

    const data: any = {}
    if (typeof capacity === 'number') data.capacity = capacity
    if (cutoffAt !== undefined) data.cutoffAt = cutoffAt ? new Date(cutoffAt) : null

    const slot = await this.prisma.deliverySlot.upsert({
      where: { city_start_end: { city, start, end } },
      update: data,
      create: { city, start, end, capacity: capacity ?? 100, cutoffAt: data.cutoffAt ?? null },
    })
    return { ok: true, slot }
  }

  @Get('calendar')
  async calendar(@Query('city') city = 'al-ain') {
    const days: { date: string; slots: any[] }[] = []
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const slots = await this.slots.getSlots(dateKey, city)
      days.push({ date: dateKey, slots })
    }
    return { city, days }
  }
}
