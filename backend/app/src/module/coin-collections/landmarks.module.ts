import { Module } from '@nestjs/common';
import { LandmarksService } from './service/landmarks.service';
import { LandmarksController } from './controller/landmarks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Landmark, LandmarkSchema } from './schema/landmark.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: Landmark.name,
      schema: LandmarkSchema
    }
  ])],
  controllers: [LandmarksController],
  providers: [LandmarksService],
  exports: [LandmarksService],
})
export class LandmarksModule { }
