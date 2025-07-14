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
import { ReportTypeModule } from './module/reports/report-type.module';
import { ReportsModule } from './module/reports/reports.module';
import { AppearancesModule } from './module/appearances/appearances.module';
import { SystemStatusModule } from './module/system-status/system-status.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { CheckinModule } from './module/checkin/checkin.module';
import { ActivitiesModule } from './module/activities/activities.module';
import { ActivitiesTypeModule } from './module/activities/activities-type.module';
import { NotificationsModule } from './module/notifications/notifications.module';
import { KafkaBootstrapModule } from './module/kafka/kafka-bootstrap.module';
import { AssessmentsModule } from './module/assessments/assessments.module';
import { AssessmentAnswersModule } from './module/assessments/assessment-answers.module';
import { PrepostQuestionsModule } from './module/prepost-questions/prepost-question.module';
import { PosttestAnswersModule } from './module/prepost-questions/posttest-answer.module';
import { PretestAnswersModule } from './module/prepost-questions/pretest-answer.module';
import { StepCountersModule } from './module/step-counters/step-counters.module';
import { FirebaseAdminModule } from './module/firebase/firebase-admin.module';
import { LandmarksModule } from './module/coin-collections/landmarks.module';
import { CoinCollectionsModule } from './module/coin-collections/coin-collections.module';
import { LamduanFlowersModule } from './module/lamduan-flowers/lamduan-flowers.module';
import { LamduanSettingModule } from './module/lamduan-flowers/lamduan-setting.module';
import { StepAchievementModule } from './module/step-counters/step-achievement.module';
import { EvouchersModule } from './module/evouchers/evouchers.module';
import { SponsorsModule } from './module/sponsors/sponsors.module';
import { DevicesModule } from './module/devices/devices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: '.env.production',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        autoIndex: true,
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
    MajorsModule,
    ReportTypeModule,
    SystemStatusModule,
    AppearancesModule,
    ReportsModule,
    SseModule,
    CheckinModule,
    ActivitiesModule,
    NotificationsModule,
    KafkaBootstrapModule,
    AssessmentsModule,
    AssessmentAnswersModule,
    PrepostQuestionsModule,
    PosttestAnswersModule,
    PretestAnswersModule,
    StepCountersModule,
    FirebaseAdminModule,
    StepCountersModule,
    StepAchievementModule,
    LandmarksModule,
    CoinCollectionsModule,
    LamduanFlowersModule,
    LamduanSettingModule,
    EvouchersModule,
    SponsorsModule,
    DevicesModule,
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
