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
import * as redisStore from 'cache-manager-ioredis';
import { SseModule } from './module/sse/sse.module';
import { SystemStatusGuard } from './module/system-status/guards/system-status.guard';
import { ReportTypeModule } from './module/report-type/report-type.module';
import { ReportsModule } from './module/reports/reports.module';
import { AppearancesModule } from './module/appearances/appearances.module';
import { SystemStatusModule } from './module/system-status/system-status.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { SponsorsModule } from './module/sponsors/sponsors.module';
import { SponsorsTypeModule } from './module/sponsors-type/sponsors-type.module';
import { CheckinModule } from './module/checkin/checkin.module';
import { ActivitiesModule } from './module/activities/activities.module';
import { EvoucherModule } from './module/evoucher/evoucher.module';
import { EvoucherTypeModule } from './module/evoucher/evoucher-type.module';
import { EvoucherCodeModule } from './module/evoucher/evoucher-code.module';
import { ActivitiesTypeModule } from './module/activities-type/activities-type.module';
import { NotificationsModule } from './module/notifications/notifications.module';
import { KafkaBootstrapModule } from './module/kafka/kafka-bootstrap.module';
import { AssessmentsModule } from './module/assessments/assessments.module';
import { PosttestModule } from './module/post-test/post-test.module';
import { PreTestModule } from './module/pre-test/pre-test.module';
import { AssessmentAnswersModule } from './module/assessment-answers/assessment-answers.module';

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
    ActivitiesTypeModule,
    ActivitiesModule,
    AuthModule,
    RoleModule,
    UsersModule,
    SchoolsModule,
    SponsorsModule,
    SponsorsTypeModule,
    MajorsModule,
    ReportTypeModule,
    SystemStatusModule,
    AppearancesModule,
    ReportsModule,
    SseModule,
    CheckinModule,
    ActivitiesModule,
    EvoucherModule,
    EvoucherCodeModule,
    EvoucherTypeModule,
    NotificationsModule,
    KafkaBootstrapModule,
    AssessmentsModule,
    PosttestModule,
    PreTestModule
    AssessmentAnswersModule,
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
export class AppModule {}
