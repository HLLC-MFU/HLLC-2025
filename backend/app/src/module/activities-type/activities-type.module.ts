import { Module } from '@nestjs/common';
import { ActivitiesTypeService } from './activities-type.service';
import { ActivitiesTypeController } from './activities-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesType, ActivitiesTypeSchema } from './schema/activitiesType.schema';

@Module({
  imports : [
    MongooseModule.forFeature([{ name: ActivitiesType.name, schema: ActivitiesTypeSchema }]),
  ],
  exports: [MongooseModule],
  controllers: [ActivitiesTypeController],
  providers: [ActivitiesTypeService],
})
export class ActivitiesTypeModule {}
