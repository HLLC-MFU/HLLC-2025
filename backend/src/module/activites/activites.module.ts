import { Module } from '@nestjs/common';
import { ActivitesService } from './activites.service';
import { ActivitesController } from './activites.controller';

@Module({
  controllers: [ActivitesController],
  providers: [ActivitesService],
})
export class ActivitesModule {}
