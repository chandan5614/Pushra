import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { randomCode, randomOTP } from '../utils/random'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async createForOrder(orderId: string) {
    const existing = await this.prisma.delivery.findUnique({ where: { orderId } })
    if (existing) return existing
    const code = randomCode()
    const otp = randomOTP()
    return this.prisma.delivery.create({
      data: { orderId, code, otp, status: 'UNASSIGNED' },
    })
  }

  async assign(orderId: string, courierId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')
    const delivery = await this.createForOrder(orderId)
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.delivery.update({
        where: { id: delivery.id },
        data: { courierId, status: 'ASSIGNED', events: { create: { type: 'ASSIGNED' } } },
        include: { courier: true },
      })
      // Notify assigned
      try {
        const track = `${process.env.PUBLIC_WEB_URL || 'http://localhost:3000'}/t/${d.code}`
        await this.notifications.sendAssigned(orderId, track)
      } catch {}
      return d
    })
  }

  async unassign(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } })
    if (!delivery) throw new NotFoundException()
    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { courierId: null, status: 'UNASSIGNED', events: { create: { type: 'UNASSIGNED' } } },
    })
  }

  async courierGuard(deliveryId: string, courierId: string) {
    const d = await this.prisma.delivery.findUnique({ where: { id: deliveryId } })
    if (!d) throw new NotFoundException()
    if (d.courierId !== courierId) throw new ForbiddenException()
    return d
  }

  async accept(deliveryId: string, courierId: string) {
    await this.courierGuard(deliveryId, courierId)
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), events: { create: { type: 'ACCEPTED' } } },
    })
  }

  async pickup(deliveryId: string, courierId: string) {
    await this.courierGuard(deliveryId, courierId)
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'PICKUP', pickupAt: new Date(), events: { create: { type: 'PICKUP' } } },
    })
  }

  async outForDelivery(deliveryId: string, courierId: string) {
    await this.courierGuard(deliveryId, courierId)
    const d = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'OUT_FOR_DELIVERY', outAt: new Date(), events: { create: { type: 'OUT_FOR_DELIVERY' } } },
    })
    try {
      const track = `${process.env.PUBLIC_WEB_URL || 'http://localhost:3000'}/t/${d.code}`
      await this.notifications.sendOutForDelivery(d.orderId, track)
    } catch {}
    return d
  }

  async updateLocation(deliveryId: string, courierId: string, lat: number, lng: number) {
    await this.courierGuard(deliveryId, courierId)
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { lastLat: lat, lastLng: lng, events: { create: { type: 'LOCATION', lat, lng } } },
    })
  }

  async deliver(
    deliveryId: string,
    courierId: string,
    data: { otp?: string; recipientName?: string; proofPhotoUrl?: string },
  ) {
    await this.courierGuard(deliveryId, courierId)
    const d = await this.prisma.delivery.findUnique({ where: { id: deliveryId } })
    if (!d) throw new NotFoundException()
    if (d.otp && data.otp && d.otp !== data.otp) throw new ForbiddenException('Invalid OTP')
    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        recipientName: data.recipientName ?? null,
        proofPhotoUrl: data.proofPhotoUrl ?? null,
        events: { create: { type: 'DELIVERED', note: data.recipientName ?? undefined } },
      },
    })
    try { await this.notifications.sendDelivered(updated.orderId) } catch {}
    return updated
  }

  async fail(deliveryId: string, courierId: string, reason: string) {
    await this.courierGuard(deliveryId, courierId)
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failedReason: reason,
        events: { create: { type: 'FAILED', note: reason } },
      },
    })
  }

  async trackingByCode(code: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { code },
      include: { events: { orderBy: { createdAt: 'asc' } }, order: true, courier: true },
    })
    if (!d) throw new NotFoundException()
    return {
      code: d.code,
      status: d.status,
      slot: null as any, // no slot reference on Order schema currently
      courier: d.courier
        ? { name: d.courier.name, phone: d.courier.phone ? d.courier.phone.replace(/.(?=.{4})/g, '*') : null }
        : null,
      lastLocation: d.lastLat && d.lastLng ? { lat: d.lastLat, lng: d.lastLng } : null,
      events: d.events.map((e) => ({ at: e.createdAt, type: e.type, note: e.note, lat: e.lat, lng: e.lng })),
      proofPhotoUrl: d.proofPhotoUrl ?? null,
    }
  }

  async adminGet(id: string) {
    return this.prisma.delivery.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } }, courier: true, order: true },
    })
  }

  // Compatibility helpers for existing controller endpoints
  async getByCode(code: string) {
    return this.trackingByCode(code)
  }

  async assignCourier(code: string, courierId?: string, courierEmail?: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { code } })
    if (!delivery) throw new NotFoundException('Delivery not found')
    let courier: any = null
    if (courierId) courier = await this.prisma.courier.findUnique({ where: { id: courierId } })
    if (!courier && courierEmail) courier = await this.prisma.courier.findUnique({ where: { email: courierEmail } })
    if (!courier) throw new NotFoundException('Courier not found')
    return this.prisma.delivery.update({
      where: { code },
      data: { courierId: courier.id, status: 'ASSIGNED', events: { create: { type: 'ASSIGNED' } } },
    })
  }

  async addEvent(code: string, type: string, note?: string, lat?: number, lng?: number) {
    const delivery = await this.prisma.delivery.findUnique({ where: { code } })
    if (!delivery) throw new NotFoundException('Delivery not found')
    return this.prisma.trackingEvent.create({ data: { deliveryId: delivery.id, type, note, lat, lng } })
  }

  async updateStatus(code: string, status: string, note?: string, lat?: number, lng?: number) {
    const delivery = await this.prisma.delivery.findUnique({ where: { code } })
    if (!delivery) throw new NotFoundException('Delivery not found')
    const data: any = { status }
    const now = new Date()
    if (status === 'ACCEPTED') data.acceptedAt = now
    if (status === 'PICKUP') data.pickupAt = now
    if (status === 'OUT_FOR_DELIVERY') data.outAt = now
    if (status === 'DELIVERED') data.deliveredAt = now
    if (status === 'FAILED') data.failedAt = now
    const updated = await this.prisma.delivery.update({ where: { code }, data })
    await this.addEvent(code, status, note, lat, lng)
    return updated
  }
}
