import { Module } from '@nestjs/common';
import { Report, ReportSchema } from './schemas/reports.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReportType,
  ReportTypeSchema,
} from '../report-type/schemas/report-type.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
      { name: ReportType.name, schema: ReportTypeSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
