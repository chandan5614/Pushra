import { Test } from '@nestjs/testing'
import { PrismaModule } from '../src/prisma/prisma.module'
import { RedisModule } from '../src/redis/redis.module'
import { SlotsService } from '../src/slots/slots.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { RedisService } from '../src/redis/redis.service'

describe('SlotsService (integration)', () => {
  let service: SlotsService
  let prisma: PrismaService
  let redis: RedisService
  let slotId: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, RedisModule],
      providers: [SlotsService],
    }).compile()
    service = moduleRef.get(SlotsService)
    prisma = moduleRef.get(PrismaService)
    redis = moduleRef.get(RedisService)

    await prisma.$connect()

    // Clear relevant redis keys
    const client = redis.getClient()
    const keys = await client.keys('slot*')
    if (keys.length) await client.del(keys)

    // Create a test slot for today 10:00-14:00
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0)
    const slot = await prisma.deliverySlot.upsert({
      where: { city_start_end: { city: 'al-ain', start, end } },
      update: { capacity: 2 },
      create: { city: 'al-ain', start, end, capacity: 2 },
    })
    slotId = slot.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await redis.onModuleDestroy?.()
  })

  it('reserves under capacity', async () => {
    const res = await service.reserveSlot('o1', slotId)
    expect(res.ok).toBe(true)
    const date = new Date()
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const slots = await service.getSlots(dateKey, 'al-ain')
    const s = slots.find((x) => x.id === slotId)!
    expect(s.reserved).toBe(1)
    expect(s.left).toBe(1)
  })

  it('enforces capacity and rolls back', async () => {
    await service.reserveSlot('o2', slotId)
    await expect(service.reserveSlot('o3', slotId)).rejects.toBeTruthy()
    const date = new Date()
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const slots = await service.getSlots(dateKey, 'al-ain')
    const s = slots.find((x) => x.id === slotId)!
    expect(s.reserved).toBe(2)
    expect(s.left).toBe(0)
  })

  it('release decrements and clears hold', async () => {
    await service.releaseSlot('o1')
    const date = new Date()
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const slots = await service.getSlots(dateKey, 'al-ain')
    const s = slots.find((x) => x.id === slotId)!
    expect(s.reserved).toBe(1)
    expect(s.left).toBe(1)
  })
})
