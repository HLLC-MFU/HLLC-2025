import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './pkg/config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './module/users/users.module';
import { SchoolsModule } from './module/schools/schools.module';
import { MajorsModule } from './module/majors/majors.module';
import { RoleModule } from './module/role/role.module';
import { AuthModule } from './module/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { GlobalCacheModule } from './pkg/cache/cache.module';
import { ActivitiesModule } from './module/activities/activities.module';
import * as redisStore from 'cache-manager-ioredis';
import { CheckinModule } from './module/checkin/checkin.module';
import { ActivitiesMajorModule } from './module/activities-major/activities-major.module';
import { SystemStatusModule } from './module/system-status/system-status.module';
import { APP_GUARD } from '@nestjs/core';
import { SystemStatusGuard } from './module/system-status/guards/system-status.guard';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { AppearancesModule } from './module/appearances/appearances.module';
import { CampaignsModule } from './module/campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<string>('REDIS_URI'),
        ttl: 60, // default TTL
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CheckinModule,
    SchoolsModule,
    MajorsModule,
    RoleModule,
    ActivitiesModule,
    AuthModule,
    GlobalCacheModule,
    ActivitiesMajorModule,
    SystemStatusModule,
    AppearancesModule,
    CampaignsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SystemStatusGuard,
    },
  ],

})
export class AppModule { }
