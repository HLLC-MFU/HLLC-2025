import { Module } from '@nestjs/common';
import { ReportCategoriesService } from './report_categories.service';
import { ReportCategoriesController } from './report_categories.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportCategory, ReportCategorySchema } from './schemas/report_categories.schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: ReportCategory.name, schema: ReportCategorySchema }])],
  controllers: [ReportCategoriesController],
  providers: [ReportCategoriesService],
})
export class ReportCategoriesModule { }
