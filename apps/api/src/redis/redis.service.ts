import { Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis, { Redis as RedisClient } from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClient

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    this.client = new Redis(url)
  }

  getClient(): RedisClient {
    return this.client
  }

  async set(key: string, value: string, ttlSec?: number) {
    if (ttlSec) {
      await this.client.set(key, value, 'EX', ttlSec)
    } else {
      await this.client.set(key, value)
    }
  }

  async get(key: string) {
    return this.client.get(key)
  }

  async del(key: string) {
    await this.client.del(key)
  }

  async ping() {
    return this.client.ping()
  }

  async onModuleDestroy() {
    await this.client.quit()
  }
}
