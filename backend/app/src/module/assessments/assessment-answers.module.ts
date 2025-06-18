import { Module } from '@nestjs/common';
import { AssessmentAnswersService } from './service/assessment-answers.service';
import { AssessmentAnswersController } from '../assessments/controller/assessment-answers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentAnswer, AssessmentAnswerSchema } from '../assessments/schema/assessment-answer.schema';
import { Assessment, AssessmentSchema } from '../assessments/schema/assessment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: AssessmentAnswer.name, schema: AssessmentAnswerSchema },
  { name: Assessment.name, schema: AssessmentSchema },
  { name: User.name, schema: UserSchema },])],
  controllers: [AssessmentAnswersController],
  providers: [AssessmentAnswersService],
  exports: [AssessmentAnswersService],
})
export class AssessmentAnswersModule { }
