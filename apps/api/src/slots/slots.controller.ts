import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { SlotsService } from './slots.service'

@Controller('slots')
export class SlotsController {
  constructor(private slots: SlotsService) {}

  @Get()
  async get(@Query('date') date: string, @Query('city') city = 'al-ain') {
    return this.slots.getSlots(date, city)
  }

  @Post('reserve')
  async reserve(@Body('orderCode') orderCode: string, @Body('slotId') slotId: string) {
    return this.slots.reserveSlot(orderCode, slotId)
  }

  @Post('release')
  async release(@Body('orderCode') orderCode: string) {
    return this.slots.releaseSlot(orderCode)
  }
}
