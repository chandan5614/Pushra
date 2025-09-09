import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { AdminOrdersController } from './admin-orders.controller'
import { OrdersPublicController } from './orders-public.controller'
import { AdminGuard } from '../auth/admin.guard'

@Module({
  providers: [OrdersService, AdminGuard],
  controllers: [OrdersController, AdminOrdersController, OrdersPublicController],
})
export class OrdersModule {}
