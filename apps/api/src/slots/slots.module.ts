import { Module } from '@nestjs/common'
import { SlotsService } from './slots.service'
import { SlotsController } from './slots.controller'
import { AdminSlotsController } from './admin-slots.controller'
import { AdminGuard } from '../auth/admin.guard'

@Module({
  providers: [SlotsService, AdminGuard],
  controllers: [SlotsController, AdminSlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}
