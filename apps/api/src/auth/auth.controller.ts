import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('magic-link')
  requestMagicLink(@Body('email') email: string) {
    return this.auth.requestMagicLink(email);
  }

  @Get('magic-link/verify')
  verifyMagicLink(@Query('token') token: string) {
    return this.auth.verifyMagicLink(token);
  }

  @Post('otp')
  requestOtp(@Body('phone') phone: string) {
    return this.auth.requestOtp(phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
    return this.auth.verifyOtp(phone, code);
  }
}

