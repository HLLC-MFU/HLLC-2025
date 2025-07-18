import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PosttestAnswer,
  PosttestAnswerSchema,
} from './schema/posttest-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PosttestAnswersController } from './controller/posttest-answers.controller';
import { PosttestAnswersService } from './service/posttest-answers.service';
import {
  PrepostQuestion,
  PrepostQuestionSchema,
} from './schema/prepost-question.schema';
import { TimeSetting, TimeSettingSchema } from '../time-setting/schema/time-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PosttestAnswer.name, schema: PosttestAnswerSchema },
      { name: User.name, schema: UserSchema },
      { name: PrepostQuestion.name, schema: PrepostQuestionSchema },
      { name: TimeSetting.name, schema: TimeSettingSchema }
    ]),
  ],
  controllers: [PosttestAnswersController],
  providers: [PosttestAnswersService],
})
export class PosttestAnswersModule { }
