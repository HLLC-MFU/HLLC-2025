import { Module } from '@nestjs/common';
import { PreTestAnswerService } from './pre-test-answer.service';
import { PreTestAnswerController } from './pre-test-answer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PreTestAnswer, PreTestAnswerSchema } from './schema/pre-test-answer.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PreTestAnswer.name, schema: PreTestAnswerSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [PreTestAnswerController],
  providers: [PreTestAnswerService],
})
export class PreTestAnswerModule { }
