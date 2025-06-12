import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrepostQuestion, PrepostQuestionSchema } from './schema/prepost-question.schema';
import { PrepostQuestionController } from './controller/prepost-question.controller';
import { PrepostQuestionService } from './service/prepost-question.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrepostQuestion.name, schema: PrepostQuestionSchema }]),
  ],
  controllers: [PrepostQuestionController],
  providers: [PrepostQuestionService],
})
export class PrepostQuestionModule { }
