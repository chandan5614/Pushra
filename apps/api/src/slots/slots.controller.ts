import { Controller, Get } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private slots: SlotsService) {}

  @Get('upcoming')
  upcoming() {
    return this.slots.listUpcoming();
  }
}

