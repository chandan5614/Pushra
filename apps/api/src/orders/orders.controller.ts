import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { JwtAuthGuard } from '../auth/jwt.guard'

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@Req() req: any) {
    return this.orders.listForUser(req.user.sub)
  }
}
