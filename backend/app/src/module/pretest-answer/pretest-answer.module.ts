import { Module } from '@nestjs/common';
import { PretestAnswerService } from './pretest-answer.service';
import { PretestAnswerController } from './pretest-answer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PretestAnswer, PretestAnswerSchema } from './schema/pre-test-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PretestAnswer.name, schema: PretestAnswerSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [PretestAnswerController],
  providers: [PretestAnswerService],
})
export class PretestAnswerModule { }
