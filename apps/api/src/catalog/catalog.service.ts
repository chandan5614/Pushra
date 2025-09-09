import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      orderBy: { name: 'asc' },
    })
  }

  getProduct(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: { variants: true } })
  }
}
