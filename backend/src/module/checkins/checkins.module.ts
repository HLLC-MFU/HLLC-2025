import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Checkin, CheckinSchema } from './schemas/checkins.schema';
import { MetadataCacheInterceptor } from '../../pkg/interceptors/metadata-cache.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Activity, ActivitySchema } from '../activites/schemas/activities.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checkin.name, schema: CheckinSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [CheckinsController],
  providers: [
    CheckinsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetadataCacheInterceptor,
    }
  ],
  exports: [CheckinsService]
})
export class CheckinsModule {}
