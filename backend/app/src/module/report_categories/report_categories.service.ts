import { Inject, Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateReportCategoryDto } from './dto/create-report_category.dto';
import { UpdateReportCategoryDto } from './dto/update-report_category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReportCategory, ReportCategoryDocument } from './schemas/report_categories.schemas';
import { Model, Types  } from 'mongoose';
import {
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
  queryAll,
} from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

@Injectable()
export class ReportCategoriesService {
  constructor(
    @InjectModel(ReportCategory.name)
    private readonly reportCategoryModel: Model<ReportCategoryDocument>,
  ) {}

  async create(createReportCategoryDto: CreateReportCategoryDto) {
   await throwIfExists(
     this.reportCategoryModel,
     {
       'name.th': createReportCategoryDto.name.th,
       'name.en': createReportCategoryDto.name.en,
     },
     'Report category already exists',
   );

   const category = new this.reportCategoryModel(createReportCategoryDto);

   try {
     return await category.save();
   } catch (error) {
     handleMongoDuplicateError(error, 'name');
   }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<ReportCategory>({
      model: this.reportCategoryModel  ,
      query,
      filterSchema: {},
    });
  }

async findOne(id: string) {
  return queryFindOne<ReportCategory>(this.reportCategoryModel, { _id: id });
}


  async update(id: string, updateReportCategoryDto: UpdateReportCategoryDto) {
    if (updateReportCategoryDto.name) {
      await throwIfExists(
        this.reportCategoryModel,
        {
          _id: { $ne: id },
          'name.th': updateReportCategoryDto.name.th,
          'name.en': updateReportCategoryDto.name.en,
        },
        'Report category with this name already exists',
      );
    }
  }

  async remove(id: string): Promise<void> {
    await queryDeleteOne<ReportCategory>(this.reportCategoryModel, id);
  }
}
