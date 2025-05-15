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
import { CheckinsModule } from './module/checkins/checkins.module';
import { SerializerInterceptor } from './pkg/interceptors/serializer.interceptor';
import { SharedMetadataModule } from './pkg/shared/metadata/metadata.module';
import { SharedEnrichmentModule } from './pkg/shared/enrichment/enrichment.module';

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

    // Inject Config
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),

    // Nest Default Caching
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: getCacheConfig,
    }),

    // Mongoose Connnection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    SharedMetadataModule,
    SharedEnrichmentModule,
    InterceptorsModule,
    UsersModule,
    AuthModule,
    SchoolsModule,
    MajorsModule,
    RoleModule,
    ActivitesModule,
    CheckinsModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: SerializerInterceptor,
    },
  ],
})
export class AppModule {}
