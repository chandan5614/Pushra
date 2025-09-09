import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as express from 'express'
import { join } from 'path'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Enable CORS for web origin
  const origin = process.env.PUBLIC_WEB_URL || 'http://localhost:3000'
  app.enableCors({ origin, credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  // Static uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')))
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

bootstrap()
