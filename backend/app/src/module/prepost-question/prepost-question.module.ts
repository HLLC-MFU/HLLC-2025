import { Module } from '@nestjs/common';
import { PrepostQuestionService } from './prepost-question.service';
import { PrepostQuestionController } from './prepost-question.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PrepostQuestion, PrepostQuestionSchema } from './schema/prepost-question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrepostQuestion.name, schema: PrepostQuestionSchema }]),
  ],
  controllers: [PrepostQuestionController],
  providers: [PrepostQuestionService],
})
export class PrepostQuestionModule { }
