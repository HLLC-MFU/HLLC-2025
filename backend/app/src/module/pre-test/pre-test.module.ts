import { Module } from '@nestjs/common';
import { PreTestService } from './pre-test.service';
import { PreTestController } from './pre-test.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PreTest, PreTestSchema } from './schema/pre-test.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{ name:PreTest.name , schema: PreTestSchema }])
  ],
  controllers: [PreTestController],
  providers: [PreTestService],
})
export class PreTestModule {}
