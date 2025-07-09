import { forwardRef, Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './controllers/activities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activities, ActivitiesSchema } from './schemas/activities.schema';
import {
  ActivitiesType,
  ActivitiesTypeSchema,
} from './schemas/activitiesType.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { UsersService } from '../users/users.service';
import { Checkin, CheckinSchema } from '../checkin/schema/checkin.schema';
import { CheckinModule } from '../checkin/checkin.module';
import { Assessment, AssessmentSchema } from '../assessments/schema/assessment.schema';
import { AssessmentAnswersModule } from '../assessments/assessment-answers.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { AssessmentsService } from '../assessments/service/assessments.service';
import { AssessmentAnswer, AssessmentAnswerSchema } from '../assessments/schema/assessment-answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activities.name, schema: ActivitiesSchema },
      { name: ActivitiesType.name, schema: ActivitiesTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: Major.name, schema: MajorSchema },
      { name: School.name, schema: SchoolSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: Assessment.name, schema: AssessmentSchema },
      { name: AssessmentAnswer.name, schema: AssessmentAnswerSchema },
    ]),
    forwardRef(() => CheckinModule),
    forwardRef(() => AssessmentAnswersModule),
    forwardRef(() => AssessmentsModule),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, UsersService],
  exports: [MongooseModule, ActivitiesService],
})
export class ActivitiesModule { }
