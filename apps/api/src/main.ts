import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module';
import { MEDIA_DIR, UPLOADS_DIR } from './db/db';

async function bootstrap() {
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log'] });
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads', maxAge: '365d', immutable: true });
  mkdirSync(MEDIA_DIR, { recursive: true });
  app.useStaticAssets(MEDIA_DIR, { prefix: '/media', maxAge: '7d' });
  app.enableCors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true });
  app.enableShutdownHooks();
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API Under Clothing en http://localhost:${port}/api`);
}
bootstrap();
