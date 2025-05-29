import cors from '@fastify/cors';
// ...ของเดิมทั้งหมด
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';

async function bootstrap() {
  Logger.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // ✅ เปิด CORS สำหรับ frontend ที่ localhost:3000
  await app.register(cors, {
    origin: 'http://localhost:3000', // หรือใช้ true ถ้าอยากให้ทุก origin เข้าได้
  });

  await app.register(compression, {
    global: true,
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('HLLC API Documentation')
    .setDescription('API Documentation for the application')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  void app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
