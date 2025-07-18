import { Module } from '@nestjs/common';
import { StepCountersService } from './service/step-counters.service';
import { StepCountersController } from './controller/step-counters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StepCounter, StepCounterSchema } from './schema/step-counter.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';
import {
  StepAchievement,
  StepAchievementSchema,
} from './schema/step-achievement.schema';
import { StepWatchService } from './service/step-watch.service';
import { Major, MajorSchema } from '../majors/schemas/major.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StepCounter.name,
        schema: StepCounterSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: School.name,
        schema: SchoolSchema,
      },
      {
        name: StepAchievement.name,
        schema: StepAchievementSchema,
      },
      {
        name: Major.name,
        schema: MajorSchema,
      },
    ]),
  ],
  controllers: [StepCountersController],
  providers: [StepCountersService, StepWatchService],
  exports: [StepCountersService, StepWatchService],
})
export class StepCountersModule { }
