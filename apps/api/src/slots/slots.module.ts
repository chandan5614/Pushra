import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { AdminSlotsController } from './admin-slots.controller';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [SlotsService, RolesGuard],
  controllers: [SlotsController, AdminSlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}
