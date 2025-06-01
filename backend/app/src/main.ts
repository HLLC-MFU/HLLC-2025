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
import { CustomValidationPipe } from './pkg/validator/custom-validation.pipe';

async function bootstrap() {
  Logger.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.register(compression, {
    global: true,
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.register(cookie);
  const config = new DocumentBuilder()
    .setTitle('HLLC API Documentation')
    .setDescription('API Documentation for the application')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
  // app.useGlobalFilters(new MongoExceptionFilter());
  app.useGlobalPipes(CustomValidationPipe);
  // app.useGlobalInterceptors(new TransformInterceptor());
  void app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
