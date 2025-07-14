import { forwardRef, Module } from '@nestjs/common';
import { AssessmentsService } from './service/assessments.service';
import { AssessmentsController } from './controller/assessments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assessment, AssessmentSchema } from './schema/assessment.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule { }
