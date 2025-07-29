import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activities, ActivitiesSchema } from '../activities/schemas/activities.schema';
import { Checkin, CheckinSchema } from '../checkin/schema/checkin.schema';
import { Assessment, AssessmentSchema } from '../assessments/schema/assessment.schema';
import { AssessmentAnswer, AssessmentAnswerSchema } from '../assessments/schema/assessment-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activities.name, schema: ActivitiesSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: Assessment.name, schema: AssessmentSchema },
      { name: AssessmentAnswer.name, schema: AssessmentAnswerSchema }
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
