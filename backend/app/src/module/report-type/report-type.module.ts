import { Module } from '@nestjs/common';
import { ReportTypeController } from './report-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportType, ReportTypeSchema } from './schemas/report-type.schema';
import { ReportTypeService } from './report-type.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReportType.name, schema: ReportTypeSchema },
    ]),
  ],
  exports: [ReportTypeService, MongooseModule],
  controllers: [ReportTypeController],
  providers: [ReportTypeService],
})
export class ReportTypeModule {}
