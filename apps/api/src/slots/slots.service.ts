import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type SlotSummary = {
  id: string;
  label: string;
  capacity: number;
  reserved: number;
  left: number;
  cutoffAt?: Date | null;
};

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  private formatDateKey(d: Date) {
    // YYYY-MM-DD (local date)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private windowLabel(start: Date, end: Date) {
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(start)}-${fmt(end)}`;
  }

  private slotKey(dateKey: string, city: string, label: string) {
    return `slot:${dateKey}:${city}:${label}`;
  }

  async getSlots(date: string, city: string): Promise<SlotSummary[]> {
    if (!city) throw new BadRequestException('city is required');
    let day: Date;
    try {
      // Parse as local date
      const [y, m, d] = date ? date.split('-').map((s) => parseInt(s, 10)) : [];
      const now = new Date();
      day = date ? new Date(y!, (m! - 1), d!) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } catch {
      throw new BadRequestException('Invalid date format (expected YYYY-MM-DD)');
    }
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await this.prisma.deliverySlot.findMany({
      where: { city, start: { gte: startOfDay, lte: endOfDay } },
      orderBy: { start: 'asc' },
    });

    const dateKey = this.formatDateKey(startOfDay);
    const client = this.redis.getClient();

    const keys = slots.map((s) => this.slotKey(dateKey, s.city, this.windowLabel(s.start, s.end)));
    const reserved = keys.length ? await client.mget(...keys) : [];

    return slots.map((s, i) => {
      const label = this.windowLabel(s.start, s.end);
      const res = reserved[i] ? parseInt(reserved[i]!, 10) : 0;
      return {
        id: s.id,
        label,
        capacity: s.capacity,
        reserved: res,
        left: Math.max(s.capacity - res, 0),
        cutoffAt: s.cutoffAt ?? null,
      };
    });
  }

  async reserveSlot(orderCode: string, slotId: string) {
    if (!orderCode || !slotId) throw new BadRequestException('orderCode and slotId are required');
    const holdKey = `slot-hold:${orderCode}`;
    const client = this.redis.getClient();

    const existingHold = await client.get(holdKey);
    if (existingHold) {
      // Idempotent: if same slot, just refresh TTL; otherwise force release first
      const [_, __, ___, labelFromHold] = existingHold.split(':');
      const slot = await this.prisma.deliverySlot.findUnique({ where: { id: slotId } });
      if (!slot) throw new NotFoundException('Slot not found');
      const dateKey = this.formatDateKey(slot.start);
      const label = this.windowLabel(slot.start, slot.end);
      const expectedKey = this.slotKey(dateKey, slot.city, label);
      if (existingHold === expectedKey) {
        await client.expire(holdKey, 10 * 60);
        return { ok: true, message: 'Hold refreshed', orderCode, slotId };
      }
      throw new BadRequestException('Existing hold found. Release before reserving another slot.');
    }

    const slot = await this.prisma.deliverySlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.cutoffAt && new Date() >= new Date(slot.cutoffAt)) {
      throw new BadRequestException('Reservation cutoff time reached');
    }
    const dateKey = this.formatDateKey(slot.start);
    const label = this.windowLabel(slot.start, slot.end);
    const counterKey = this.slotKey(dateKey, slot.city, label);

    const newVal = await client.incr(counterKey);
    if (newVal > slot.capacity) {
      await client.decr(counterKey);
      throw new BadRequestException('Slot capacity reached');
    }
    await client.setex(holdKey, 10 * 60, counterKey);
    return { ok: true, orderCode, slotId };
  }

  async releaseSlot(orderCode: string) {
    if (!orderCode) throw new BadRequestException('orderCode is required');
    const client = this.redis.getClient();
    const holdKey = `slot-hold:${orderCode}`;
    const counterKey = await client.get(holdKey);
    if (!counterKey) {
      return { ok: false, message: 'No active hold' };
    }
    // Best-effort to avoid negative values
    const current = await client.get(counterKey);
    if (current && parseInt(current, 10) > 0) {
      await client.decr(counterKey);
    }
    await client.del(holdKey);
    return { ok: true };
  }
}
