import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  @Get()
  async check() {
    let db = 'ok';
    let redis = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      db = 'error';
    }
    try {
      await this.redis.ping();
    } catch (e) {
      redis = 'error';
    }
    return { status: 'ok', services: { db, redis } };
  }
}

