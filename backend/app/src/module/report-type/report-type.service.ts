import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReportType, ReportTypeDocument } from './schemas/report-type.schema';
import { Model } from 'mongoose';
import {
  queryDeleteOne,
  queryFindOne,
  queryAll,
} from 'src/pkg/helper/query.util';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

@Injectable()
export class ReportTypeService {
  constructor(
    @InjectModel(ReportType.name)
    private readonly reportTypeModel: Model<ReportTypeDocument>,
  ) {}

  async create(createReportCategoryDto: CreateReportCategoryDto) {
   await throwIfExists(
     this.reportTypeModel,
     {
       'name.th': createReportCategoryDto.name.th,
       'name.en': createReportCategoryDto.name.en,
     },
     'Report category already exists',
   );

   const category = new this.reportTypeModel(createReportCategoryDto);

   try {
     return await category.save();
   } catch (error) {
     handleMongoDuplicateError(error, 'name');
   }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<ReportType>({
      model: this.reportTypeModel  ,
      query,
      filterSchema: {},
    });
  }

async findOne(id: string) {
  return queryFindOne<ReportType>(this.reportTypeModel, { _id: id });
}


async update(id: string, updateReportCategoryDto: UpdateReportCategoryDto) {
  if (updateReportCategoryDto.name) {
    await throwIfExists(
      this.reportTypeModel,
      {
        _id: { $ne: id },
        'name.th': updateReportCategoryDto.name.th,
        'name.en': updateReportCategoryDto.name.en,
      },
      'Report category with this name already exists',
    );
  }

  const updated = await this.reportTypeModel.findByIdAndUpdate(
    id,
    updateReportCategoryDto,
    { new: true } // ← ให้ return ค่าใหม่ที่อัปเดตแล้ว
  ).lean();

  if (!updated) {
    throw new NotFoundException('Category not found');
  }

  return {
    message: 'Category updated successfully',
    data: updated,
  };
}


  async remove(id: string): Promise<void> {
    await queryDeleteOne<ReportType>(this.reportTypeModel, id);
  }
}
