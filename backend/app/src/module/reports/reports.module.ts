import { Module } from '@nestjs/common';
import { Report, ReportSchema } from './schemas/reports.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReportCategory,
  ReportCategorySchema,
} from '../report_categories/schemas/report_categories.schemas';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
      { name: ReportCategory.name, schema: ReportCategorySchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
