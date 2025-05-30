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
  ],
  providers: [],
})
export class AppModule {}
