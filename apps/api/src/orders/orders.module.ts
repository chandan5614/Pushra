import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({ providers: [OrdersService, RolesGuard], controllers: [OrdersController, AdminOrdersController] })
export class OrdersModule {}
