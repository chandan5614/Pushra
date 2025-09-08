import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ProductsController } from './products.controller';

@Module({ providers: [CatalogService], controllers: [ProductsController] })
export class CatalogModule {}

