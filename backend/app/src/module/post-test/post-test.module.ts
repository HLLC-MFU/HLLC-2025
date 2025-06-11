import { Module } from '@nestjs/common';
import { PosttestService } from './post-test.service';
import { PosttestController } from './post-test.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Posttest, PosttestSchema } from './schema/post-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Posttest.name, schema: PosttestSchema }]),
  ],
  controllers: [PosttestController],
  providers: [PosttestService],
})
export class PosttestModule { }
