import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assessment, AssessmentSchema } from './schema/assessment.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assessment.name, schema: AssessmentSchema }]),
    ActivitiesModule
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
