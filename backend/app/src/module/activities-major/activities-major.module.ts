import { Module } from '@nestjs/common';
import { ActivitiesMajorService } from './activities-major.service';
import { ActivitiesMajorController } from './activities-major.controller';

@Module({
  controllers: [ActivitiesMajorController],
  providers: [ActivitiesMajorService],
})
export class ActivitiesMajorModule {}
