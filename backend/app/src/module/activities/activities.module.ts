import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activities, ActivitiesSchema } from './schema/activities.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Activities.name,
        schema: ActivitiesSchema,
      },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [MongooseModule],
})
export class ActivitiesModule {}
