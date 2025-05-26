import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Entity & Document
import { Report, ReportDocument } from './schemas/reports.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ReportCategory, ReportCategoryDocument } from '../report_categories/schemas/report_categories.schemas';

// DTO
import { CreateReportDto } from './dto/create-report.dto';

// Helpers
import { queryAll, queryFindOne, queryUpdateOne, queryDeleteOne } from 'src/pkg/helper/query.util';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { UpdateReportDto } from './dto/update-report.dto';

const userSelectFields = 'username name';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(ReportCategory.name)
    private readonly categoryModel: Model<ReportCategoryDocument>,
  ) {}

  async create(createReportDto: CreateReportDto) {
    await findOrThrow(this.userModel, createReportDto.reporter, 'User not found');
    await findOrThrow(this.categoryModel, createReportDto.category, 'Category not found');

    const report = new this.reportModel({
      ...createReportDto,
      reporter: new Types.ObjectId(createReportDto.reporter),
      category: new Types.ObjectId(createReportDto.category),
    });

    try {
      return await report.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'reporter_id');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Report>({
      model: this.reportModel,
      query,
      filterSchema: {},
      buildPopulateFields: () =>
        Promise.resolve([
          { path: 'reporter', select: userSelectFields },
          { path: 'category' },
        ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Report>(this.reportModel, { _id: id }, [
      { path: 'reporter_id', },
      { path: 'category_id' },
    ]);
  }

  async update(id: string, UpdateReportDto: UpdateReportDto) {
    return queryUpdateOne<Report>(this.reportModel, id, UpdateReportDto);
  }

  async remove(id: string) {
    return queryDeleteOne<Report>(this.reportModel, id);
  }
}
