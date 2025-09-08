import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  listUpcoming() {
    return this.prisma.deliverySlot.findMany({
      where: { start: { gt: new Date() } },
      orderBy: { start: 'asc' },
      take: 10,
    });
  }
}

