import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Enable CORS for web origin
  const origin = process.env.PUBLIC_WEB_URL || 'http://localhost:3000'
  app.enableCors({ origin, credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

bootstrap()
