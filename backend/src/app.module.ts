import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './pkg/config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './module/users/users.module';
import { SchoolsModule } from './module/schools/schools.module';
import { MajorsModule } from './module/majors/majors.module';
import { RoleModule } from './module/role/role.module';
import { AuthModule } from './module/auth/auth.module';
import { ActivitesModule } from './module/activites/activites.module';
import { getCacheConfig } from './pkg/config/cache.config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './pkg/filters/http-exception.filter';
import { HttpCacheInterceptor } from './pkg/interceptors/cache.interceptor';
import { CacheModule } from './pkg/cache/cache.module';
import { InterceptorsModule } from './pkg/interceptors/interceptors.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike('HLLC-2025', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: getCacheConfig,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    InterceptorsModule,
    UsersModule,
    AuthModule,
    SchoolsModule,
    MajorsModule,
    RoleModule,
    ActivitesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (logger) => new AllExceptionsFilter(logger),
      inject: ['winston'],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule {}
