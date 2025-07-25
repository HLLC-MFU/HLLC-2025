import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PretestAnswer,
  PretestAnswerSchema,
} from './schema/pretest-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PretestAnswersController } from './controller/pretest-answers.controller';
import { PretestAnswersService } from './service/pretest-answers.service';
import {
  PrepostQuestion,
  PrepostQuestionSchema,
} from './schema/prepost-question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PretestAnswer.name, schema: PretestAnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: PrepostQuestion.name, schema: PrepostQuestionSchema },
    ]),
  ],
  controllers: [PretestAnswersController],
  providers: [PretestAnswersService],
})
export class PretestAnswersModule {}
