import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Polyfill for BigInt serialization to prevent 500 errors
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'https://telegrambot-1-b7u3.onrender.com',
      'https://telegrambot-dppa.onrender.com',
      'https://dejenrewards-miniapp.onrender.com',
      'https://dejenrewards-admin.onrender.com'
    ],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 10000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();
