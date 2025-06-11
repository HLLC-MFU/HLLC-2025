import { Module } from '@nestjs/common';
import { PostTestAnswerService } from './post-test-answer.service';
import { PostTestAnswerController } from './post-test-answer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostTestAnswer, PostTestAnswerSchema } from './schema/post-test-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: PostTestAnswer.name, schema: PostTestAnswerSchema },
    { name: User.name, schema: UserSchema}
  ])],
  controllers: [PostTestAnswerController],
  providers: [PostTestAnswerService],
})
export class PostTestAnswerModule { }
