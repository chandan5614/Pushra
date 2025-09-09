import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { DeliveriesService } from './deliveries.service'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { AdminGuard } from '../auth/admin.guard'

@Controller()
export class DeliveriesController {
  constructor(private readonly svc: DeliveriesService) {}

  // Public tracking
  @Get('/tracking/:code')
  async tracking(@Param('code') code: string) {
    return this.svc.trackingByCode(code)
  }

  // Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/admin/orders/:orderId/assign')
  async assign(@Param('orderId') orderId: string, @Body() body: { courierId: string }) {
    return this.svc.assign(orderId, body.courierId)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/admin/orders/:orderId/unassign')
  async unassign(@Param('orderId') orderId: string) {
    return this.svc.unassign(orderId)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/admin/deliveries/:id')
  async adminGet(@Param('id') id: string) {
    return this.svc.adminGet(id)
  }

  // Courier (JWT for courier)
  @UseGuards(JwtAuthGuard) // replace with CourierGuard if separated
  @Get('/courier/stops')
  async courierStops() {
    // In a real guard, you'd read req.user.courierId
    return { todo: true }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/accept')
  async accept(@Param('id') id: string, @Body() body: { courierId: string }) {
    return this.svc.accept(id, body.courierId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/pickup')
  async pickup(@Param('id') id: string, @Body() body: { courierId: string }) {
    return this.svc.pickup(id, body.courierId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/out-for-delivery')
  async ood(@Param('id') id: string, @Body() body: { courierId: string }) {
    return this.svc.outForDelivery(id, body.courierId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/location')
  async location(
    @Param('id') id: string,
    @Body() body: { courierId: string; lat: number; lng: number },
  ) {
    return this.svc.updateLocation(id, body.courierId, body.lat, body.lng)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/deliver')
  async deliver(
    @Param('id') id: string,
    @Body() body: { courierId: string; otp?: string; recipientName?: string; proofPhotoUrl?: string },
  ) {
    return this.svc.deliver(id, body.courierId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/courier/deliveries/:id/fail')
  async fail(@Param('id') id: string, @Body() body: { courierId: string; reason: string }) {
    return this.svc.fail(id, body.courierId, body.reason)
  }
}
