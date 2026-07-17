import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, exposedHeaders: ['content-disposition'] });
  app.setGlobalPrefix('api');
  await app.listen(Number(process.env.PORT || 3000));
  console.log(`开馆助手 API: http://localhost:${process.env.PORT || 3000}/api`);
}
bootstrap();
