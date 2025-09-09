import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { EmailService } from '../notifications/email.service'
import crypto from 'crypto'
import { randomOTP } from '../utils/random'

function maskEmail(email: string) {
  const [u, d] = email.split('@')
  const front = u.slice(0, 2)
  return `${front}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`
}

function maskPhone(phone: string) {
  const last4 = phone.slice(-4)
  return `${'*'.repeat(Math.max(0, phone.length - 4))}${last4}`
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
    private email: EmailService,
  ) {}

  async requestMagicLink(email: string) {
    const token = cryptoRandom(32)
    const ttl = 10 * 60 // 10 minutes
    await this.redis.set(`magic:${token}`, email, ttl)
    const publicUrl = process.env.MAGICLINK_PUBLIC_URL || 'http://localhost:3000'
    const link = `${publicUrl}/auth/callback?token=${token}`
    try {
      await this.email.send(email, 'Your Pushra sign-in link', `Sign in by clicking: ${link}`)
    } catch (e) {
      // non-fatal: email adapter not configured
      console.warn('email send failed', e)
    }
    return {
      message: `Magic link sent to ${maskEmail(email)}`,
      devLink: process.env.NODE_ENV !== 'production' ? link : undefined,
    }
  }

  async verifyMagicLink(token: string) {
    const email = await this.redis.get(`magic:${token}`)
    if (!email) throw new UnauthorizedException('Invalid or expired token')
    await this.redis.del(`magic:${token}`)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email },
      update: {},
    })
    const role = isAdminEmail(user.email) ? 'admin' : 'user'
    const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email, role })
    return { access_token }
  }

  async requestOtp(phone: string) {
    const code = process.env.NODE_ENV === 'production' ? randomOTP() : '123456'
    await this.redis.set(`otp:${phone}`, code, 5 * 60)
    return { message: `OTP sent to ${maskPhone(phone)}` }
  }

  async verifyOtp(phone: string, code: string) {
    const expected = await this.redis.get(`otp:${phone}`)
    if (!expected || expected !== code) throw new UnauthorizedException('Invalid OTP')
    await this.redis.del(`otp:${phone}`)
    const email = `${phone}@pushra.local` // stub mapping
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email },
      update: {},
    })
    const role = isAdminEmail(user.email) ? 'admin' : 'user'
    const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email, role })
    return { access_token }
  }
}

function cryptoRandom(len: number) {
  const bytes = new Uint8Array(len)
  crypto.randomFillSync(bytes)
  return Buffer.from(bytes).toString('base64url')
}

// randomDigits replaced by randomOTP in ../utils/random

function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.includes(email)
}
