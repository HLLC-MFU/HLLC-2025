import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import cookie from '@fastify/cookie';
import { fastifyStatic } from '@fastify/static';
import path from 'path';
import multipart from '@fastify/multipart';
import { MongoExceptionFilter } from './pkg/filters/mongo.filter';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  Logger.log(`Server is running on port ${process.env.PORT ?? 3000}`);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // ✅ Register cookie FIRST
  await app.register(cookie);

  // Then other plugins
  await app.register(compression, {
    global: true,
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/api/uploads/',
  });

  // ✅ Global prefix and CORS after plugin setup
  app.setGlobalPrefix('api');

  const corsWhitelist = (
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsWhitelist,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('HLLC API Documentation')
    .setDescription('API Documentation for the application')
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  // Global error filter
  app.useGlobalFilters(new MongoExceptionFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  Logger.log(`Server is running on port ${process.env.PORT}`);
}

bootstrap().catch((err) => {
  Logger.error('Error starting server', err);
});
