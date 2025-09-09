import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async upsertByEmail(email: string, name?: string) {
    return this.prisma.user.upsert({
      where: { email },
      create: { email, name },
      update: { name },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }
}
