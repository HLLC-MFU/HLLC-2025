import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrepostQuestion, PrepostQuestionSchema } from './schema/prepost-question.schema';
import { PrepostQuestionsController } from './controller/prepost-questions.controller';
import { PrepostQuestionsService } from './service/prepost-questions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrepostQuestion.name, schema: PrepostQuestionSchema }]),
  ],
  controllers: [PrepostQuestionsController],
  providers: [PrepostQuestionsService],
})
export class PrepostQuestionsModule { }
