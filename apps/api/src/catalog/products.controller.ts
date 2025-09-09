import { Controller, Get, Param } from '@nestjs/common'
import { CatalogService } from './catalog.service'

@Controller('products')
export class ProductsController {
  constructor(private catalog: CatalogService) {}

  @Get()
  list() {
    return this.catalog.listProducts()
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalog.getProduct(id)
  }
}
