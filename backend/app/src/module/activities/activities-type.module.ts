import { Module } from '@nestjs/common';
import { ActivitiesTypeService } from './services/activities-type.service';
import { ActivitiesTypeController } from './controllers/activities-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivitiesType,
  ActivitiesTypeSchema,
} from './schemas/activitiesType.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivitiesType.name, schema: ActivitiesTypeSchema },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [ActivitiesTypeController],
  providers: [ActivitiesTypeService],
})
export class ActivitiesTypeModule {}
