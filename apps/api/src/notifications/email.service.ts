import { Injectable } from '@nestjs/common'

@Injectable()
export class EmailService {
  async send(to: string, subject: string, body: string) {
    const from = process.env.MAGICLINK_FROM || process.env.EMAIL_FROM || 'noreply@pushra.local'
    // Placeholder: integrate nodemailer/SES/SendGrid here
    console.log(`[email] from=${from} to=${to} subject=${subject} body=${body.substring(0, 120)}`)
  }
}
