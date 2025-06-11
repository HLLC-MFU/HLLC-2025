import { Module } from '@nestjs/common';
import { AssessmentAnswersService } from './assessment-answers.service';
import { AssessmentAnswersController } from './assessment-answers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentAnswer, AssessmentAnswerSchema } from './schema/assessment-answer.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: AssessmentAnswer.name, schema: AssessmentAnswerSchema }])],
  controllers: [AssessmentAnswersController],
  providers: [AssessmentAnswersService],
  exports: [AssessmentAnswersService],
})
export class AssessmentAnswersModule { }
