import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('PaymentsController (integration)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let slotId: string
  let variantId: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    await app.init()

    // Ensure a slot exists today
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0)
    const slot = await prisma.deliverySlot.upsert({
      where: { city_start_end: { city: 'al-ain', start, end } },
      update: { capacity: 100 },
      create: { city: 'al-ain', start, end, capacity: 100 },
    })
    slotId = slot.id

    const variant = await prisma.productVariant.findFirst()
    if (!variant) throw new Error('No product variant found; seed the DB first')
    variantId = variant.id
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /checkout/init happy path', async () => {
    const res = await request(app.getHttpServer())
      .post('/checkout/init')
      .send({ items: [{ variantId, quantity: 1 }], slotId, email: 'buyer@pushra.local' })
      .expect(201)

    expect(res.body).toHaveProperty('provider')
    expect(res.body).toHaveProperty('orderId')
    expect(res.body.clientSecret || res.body.redirectUrl).toBeTruthy()
  })
})
