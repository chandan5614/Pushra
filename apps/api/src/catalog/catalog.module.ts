import { Module } from '@nestjs/common'
import { CatalogService } from './catalog.service'
import { ProductsController } from './products.controller'
import { CatalogAliasController } from './catalog.controller'

@Module({ providers: [CatalogService], controllers: [ProductsController, CatalogAliasController] })
export class CatalogModule {}
