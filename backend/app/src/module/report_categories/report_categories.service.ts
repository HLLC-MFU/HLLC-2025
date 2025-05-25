import { Injectable } from '@nestjs/common';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReportCategory, ReportCategoryDocument } from './schemas/report_categories.schemas';
import { Model } from 'mongoose';

@Injectable()
export class ReportCategoriesService {
  constructor(@InjectModel(ReportCategory.name) private readonly reportCategoryModel: Model<ReportCategoryDocument>) { }

  create(createReportCategoryDto: CreateReportCategoryDto) {
    return this.reportCategoryModel.create(createReportCategoryDto);
  }

  findAll() {
    return this.reportCategoryModel.find().exec();
  }

  findOne(id: string) {
    return this.reportCategoryModel.findById(id);
  }

  update(id: string, updateReportCategoryDto: UpdateReportCategoryDto) {
    return this.reportCategoryModel.findByIdAndUpdate(id, updateReportCategoryDto, { new: true });
  }

  remove(id: string) {
    return this.reportCategoryModel.findByIdAndDelete(id);
  }
}
