import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('magic-link')
  requestMagicLink(@Body('email') email: string) {
    return this.auth.requestMagicLink(email)
  }

  // New canonical endpoint
  @Post('magiclink')
  requestMagicLink2(@Body('email') email: string) {
    return this.auth.requestMagicLink(email)
  }

  @Get('magic-link/verify')
  verifyMagicLink(@Query('token') token: string) {
    return this.auth.verifyMagicLink(token)
  }

  // New callback endpoint sets httpOnly cookie
  @Get('callback')
  async callback(@Query('token') token: string, @Res({ passthrough: true }) res: any) {
    const { access_token } = await this.auth.verifyMagicLink(token)
    const secure = process.env.NODE_ENV === 'production'
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return { ok: true }
  }

  @Post('otp')
  requestOtp(@Body('phone') phone: string) {
    return this.auth.requestOtp(phone)
  }

  @Post('otp/verify')
  async verifyOtp(
    @Body('phone') phone: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: any,
  ) {
    const { access_token } = await this.auth.verifyOtp(phone, code)
    const secure = process.env.NODE_ENV === 'production'
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return { ok: true }
  }

  // Alias endpoint name per spec
  @Post('verify-otp')
  verifyOtpAlias(
    @Body('phone') phone: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.verifyOtp(phone, code, res)
  }
}
