import { Module } from '@nestjs/common';
import { PosttestAnswerService } from './posttest-answer.service';
import { PostTestAnswerController } from './posttest-answer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PosttestAnswer, PosttestAnswerSchema } from './schema/posttest-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: PosttestAnswer.name, schema: PosttestAnswerSchema },
    { name: User.name, schema: UserSchema}
  ])],
  controllers: [PostTestAnswerController],
  providers: [PosttestAnswerService],
})
export class PosttestAnswerModule { }
