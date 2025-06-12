import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PretestAnswer, PretestAnswerSchema } from '../prepost-question/schema/pretest-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PretestAnswerController } from './controller/pretest-answer.controller';
import { PretestAnswerService } from './service/pretest-answer.service';
import { PrepostQuestion, PrepostQuestionSchema } from './schema/prepost-question.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: PretestAnswer.name, schema: PretestAnswerSchema }, 
    { name: User.name, schema: UserSchema },
    { name: PrepostQuestion.name, schema: PrepostQuestionSchema},
  ])],
  controllers: [PretestAnswerController],
  providers: [PretestAnswerService],
})
export class PretestAnswerModule { }
