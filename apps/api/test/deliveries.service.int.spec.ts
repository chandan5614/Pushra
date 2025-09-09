import { Test } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import { DeliveriesService } from '../src/deliveries/deliveries.service'
import { NotificationsService } from '../src/notifications/notifications.service'

describe('DeliveriesService (integration)', () => {
  let prisma: PrismaService
  let svc: DeliveriesService
  let userId: string
  let orderId: string
  let courierId: string

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [PrismaService, DeliveriesService, NotificationsService],
    }).compile()
    prisma = mod.get(PrismaService)
    svc = mod.get(DeliveriesService)
    await prisma.$connect()

    const user = await prisma.user.create({ data: { email: `dtest_${Date.now()}@pushra.local` } })
    userId = user.id
    const order = await prisma.order.create({ data: { userId } })
    orderId = order.id
    const courier = await prisma.courier.create({ data: { name: 'Tester', email: `courier_${Date.now()}@pushra.local`, status: 'AVAILABLE' as any } })
    courierId = courier.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('createForOrder generates code and otp', async () => {
    const d = await svc.createForOrder(orderId)
    expect(d.code).toBeTruthy()
    expect(d.otp).toBeTruthy()
    expect(d.status).toBe('UNASSIGNED')
  })

  it('assign/unassign emits events', async () => {
    await svc.assign(orderId, courierId)
    let d = await prisma.delivery.findUnique({ where: { orderId }, include: { events: true } })
    expect(d?.status).toBe('ASSIGNED')
    expect(d?.events.some((e) => e.type === 'ASSIGNED')).toBe(true)

    await svc.unassign(orderId)
    d = await prisma.delivery.findUnique({ where: { orderId }, include: { events: true } })
    expect(d?.status).toBe('UNASSIGNED')
    expect(d?.events.some((e) => e.type === 'UNASSIGNED')).toBe(true)
  })

  it('deliver OTP enforcement and fail(reason)', async () => {
    // Prepare new order/delivery
    const order = await prisma.order.create({ data: { userId } })
    await svc.createForOrder(order.id)
    const d = await prisma.delivery.findUnique({ where: { orderId: order.id } })
    expect(d).toBeTruthy()
    // Assign to courier
    await prisma.delivery.update({ where: { id: d!.id }, data: { courierId, status: 'ASSIGNED' as any } })
    // Wrong OTP should throw
    await expect(svc.deliver(d!.id, courierId, { otp: '000000' })).rejects.toBeTruthy()
    // Correct OTP
    const fresh = await prisma.delivery.findUnique({ where: { id: d!.id } })
    await expect(svc.deliver(d!.id, courierId, { otp: fresh!.otp || undefined })).resolves.toBeTruthy()
    // New order to test fail()
    const order2 = await prisma.order.create({ data: { userId } })
    await svc.createForOrder(order2.id)
    const d2 = await prisma.delivery.findUnique({ where: { orderId: order2.id } })
    await prisma.delivery.update({ where: { id: d2!.id }, data: { courierId, status: 'ASSIGNED' as any } })
    const failed = await svc.fail(d2!.id, courierId, 'no answer')
    expect(failed.status).toBe('FAILED')
    expect(failed.failedReason).toBe('no answer')
  })
})

