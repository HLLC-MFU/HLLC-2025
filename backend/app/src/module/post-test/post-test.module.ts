import { Module } from '@nestjs/common';
import { PosttestService } from './post-test.service';
import { PosttestController } from './post-test.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostTest, PosttestSchema } from './schema/post-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostTest.name, schema: PosttestSchema }]),
  ],
  controllers: [PosttestController],
  providers: [PosttestService],
})
export class PosttestModule { }
