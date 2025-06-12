import { Module } from '@nestjs/common';
import { PreTestAnswerService } from './pre-test-answer.service';
import { PreTestAnswerController } from './pre-test-answer.controller';

@Module({
  controllers: [PreTestAnswerController],
  providers: [PreTestAnswerService],
})
export class PreTestAnswerModule {}
