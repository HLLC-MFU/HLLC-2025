// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpAdapterHost } from '@nestjs/core';
// Keep the import but don't use the interceptor temporarily until fixed
// import { HttpCacheInterceptor } from './pkg/interceptors/cache.interceptor';

async function bootstrap() {
  // Set development mode for easier debugging
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const app = await NestFactory.create(AppModule);

  // Disable global cache interceptor temporarily
  // const cacheManager = app.get(CACHE_MANAGER);
  // app.useGlobalInterceptors(new HttpCacheInterceptor(cacheManager, app.get(HttpAdapterHost)));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('HLLC API Documentation')
    .setDescription('API Documentation for the application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌎 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
