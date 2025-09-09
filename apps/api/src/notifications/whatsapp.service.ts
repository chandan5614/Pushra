import { Injectable } from '@nestjs/common'

@Injectable()
export class WhatsAppService {
  async sendTemplate(to: string, templateId: string, vars: Record<string, any>) {
    // Placeholder: integrate WA Cloud/Twilio
    console.log(`[whatsapp] to=${to} template=${templateId} vars=${JSON.stringify(vars)}`)
  }
}
