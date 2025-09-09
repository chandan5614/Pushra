import { Controller, Get } from '@nestjs/common'
import { CatalogService } from './catalog.service'

@Controller('catalog')
export class CatalogAliasController {
  constructor(private catalog: CatalogService) {}

  @Get('products')
  list() {
    return this.catalog.listProducts()
  }
}
