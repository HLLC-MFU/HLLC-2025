// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { SerializerInterceptor } from './pkg/interceptors/serializer.interceptor';

async function bootstrap() {
  // Set development mode for easier debugging
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const app = await NestFactory.create(AppModule);

  // Disable global cache interceptor temporarily
  // const cacheManager = app.get(CACHE_MANAGER);
  app.useGlobalInterceptors(
    new SerializerInterceptor()
    // Disable global cache interceptor temporarily
    // new HttpCacheInterceptor(cacheManager, app.get(HttpAdapterHost), app.get(Logger))
  );

// Use Validation Pipe
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, transform: true })
);

  // Set Global Prefix
  app.setGlobalPrefix('api');



  // Use Helmet
  app.use(helmet());

  // Use Compression
  app.use(compression());

  // Enable CORS
  app.enableCors();

  // Config Swagger
  const config = new DocumentBuilder()
    .setTitle('HLLC API Documentation')
    .setDescription('API Documentation for the application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Create Swagger document
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌎 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
