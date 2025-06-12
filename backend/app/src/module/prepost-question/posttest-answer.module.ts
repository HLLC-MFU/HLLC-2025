import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PosttestAnswer, PosttestAnswerSchema } from '../prepost-question/schema/posttest-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PostTestAnswerController } from './controller/posttest-answer.controller';
import { PosttestAnswerService } from './service/posttest-answer.service';
import { PrepostQuestion, PrepostQuestionSchema } from './schema/prepost-question.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: PosttestAnswer.name, schema: PosttestAnswerSchema },
    { name: User.name, schema: UserSchema},
    { name: PrepostQuestion.name , schema: PrepostQuestionSchema}
  ])],
  controllers: [PostTestAnswerController],
  providers: [PosttestAnswerService],
})
export class PosttestAnswerModule { }
