import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import fs from 'fs'
import path from 'path'

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async check() {
    let db = 'ok'
    let redis = 'ok'
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch (e) {
      db = 'error'
    }
    try {
      await this.redis.ping()
    } catch (e) {
      redis = 'error'
    }
    let version = '0.0.0'
    try {
      // Attempt to read root package.json version
      const p = path.join(process.cwd(), '..', '..', 'package.json')
      const raw = fs.readFileSync(p, 'utf8')
      const pkg = JSON.parse(raw)
      if (pkg && pkg.version) version = pkg.version
    } catch (e) {
      version = '0.0.0'
    }
    const payments =
      process.env.ALLOW_TEST_PAYMENTS === 'true' ||
      Boolean(process.env.PAYTABS_SERVER_KEY) ||
      Boolean(process.env.STRIPE_SECRET_KEY)
        ? 'ok'
        : 'disabled'
    return {
      status: 'ok',
      api: 'pushra',
      version,
      time: new Date().toISOString(),
      services: { db, redis, payments },
    }
  }
}
