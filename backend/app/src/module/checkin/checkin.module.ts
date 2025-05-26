import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { Checkin, CheckinSchema } from './schema/checkin.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { ActivitiesSchema } from '../activities/schema/activities.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { Activities } from '../activities/schema/activities.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Checkin.name,
        schema: CheckinSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Activities.name,
        schema: ActivitiesSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [CheckinController],
  providers: [CheckinService],
})
export class CheckinModule {}
