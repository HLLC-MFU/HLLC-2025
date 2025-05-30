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
import { ActivitiesTypeModule } from './module/activities-type/activities-type.module';
import { EvoucherTypeModule } from './module/evoucher-type/evoucher-type.module';
import { EvoucherModule } from './module/evoucher/evoucher.module';
import { EvoucherCodeModule } from './module/evoucher-code/evoucher-code.module';
import { SponsorsModule } from './module/sponsors/sponsors.module';
import { SponsorsTypeModule } from './module/sponsors-type/sponsors-type.module';
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
    GlobalCacheModule,
    AuthModule,
    RoleModule,
    UsersModule,
    CheckinModule,
    SchoolsModule,
    MajorsModule,
    ActivitiesModule,
    ActivitiesTypeModule,
    EvoucherTypeModule,
    EvoucherModule,
    EvoucherCodeModule,
    SponsorsModule,
    SponsorsTypeModule,
    CampaignsModule,
  ],
  providers: [],
})
export class AppModule {}
