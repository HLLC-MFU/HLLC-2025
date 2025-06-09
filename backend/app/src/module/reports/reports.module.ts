import { Module } from '@nestjs/common';
import { Report, ReportSchema } from './schemas/reports.schema';
import { ReportsService } from './service/reports.service';
import { ReportsController } from './controller/reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReportType,
  ReportTypeSchema,
} from './schemas/report-type.schema';
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
