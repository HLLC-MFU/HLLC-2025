import { Module } from '@nestjs/common';
import { LamduanFlowersService } from './lamduan-flowers.service';
import { LamduanFlowersController } from './lamduan-flowers.controller';

@Module({
  controllers: [LamduanFlowersController],
  providers: [LamduanFlowersService],
})
export class LamduanFlowersModule {}
