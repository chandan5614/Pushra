import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminGuard } from '../auth/admin.guard';

@Module({ providers: [OrdersService, AdminGuard], controllers: [OrdersController, AdminOrdersController] })
export class OrdersModule {}
