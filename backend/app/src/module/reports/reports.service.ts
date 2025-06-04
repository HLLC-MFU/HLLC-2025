import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/reports.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { UpdateReportDto } from './dto/update-report.dto';
import { PopulateField } from 'src/pkg/types/query';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportTypeDocument } from '../report-type/schemas/report-type.schema';
import { ReportType } from '../report-type/schemas/report-type.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(ReportType.name)
    private readonly reportTypeModel: Model<ReportTypeDocument>,
  ) {}

  async create(createReportDto: CreateReportDto) {
    await findOrThrow(
      this.userModel,
      createReportDto.reporter,
      'User not found',
    );
    await findOrThrow(
      this.reportTypeModel,
      createReportDto.category,
        'Report type not found',
    );

    const report = new this.reportModel({
      ...createReportDto,
      reporter: new Types.ObjectId(createReportDto.reporter),
      category: new Types.ObjectId(createReportDto.category),
    });

    try {
      return await report.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Report>({
      model: this.reportModel,
      query: {
        ...query,
        excluded:
          'reporter.password,reporter.refreshToken,reporter.role,reporter.metadata,reporter.__v,__v',
      },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([{ path: 'reporter' }, { path: 'category' }]),
    });
  }

  async findAllByCategory(categoryId: string) {
    const query = {
      category: new Types.ObjectId(categoryId),
    };

    const result = await queryAll<Report>({
      model: this.reportModel,
      query: query as unknown as Record<string, string>,
      filterSchema: {
        category: 'string',
      } as const,
      populateFields: () =>
        Promise.resolve([{ path: 'reporter' }, { path: 'category' }]),
    });

    const reportsWithoutCategory = result.data.map(
      ({ category, ...rest }) => rest,
    );

    const category =
      result.data[0]?.category ||
      (await this.reportTypeModel.findById(categoryId));

    return {
      category,
      reports: reportsWithoutCategory,
    };
  }

  async findOne(id: string) {
    const populateFields: PopulateField[] = [
      { path: 'reporter' },
      { path: 'category' },
    ];
    return queryFindOne<Report>(this.reportModel, { _id: id }, populateFields);
  }

  async update(id: string, updateReportDto: UpdateReportDto) {
    const updated = await queryUpdateOne<Report>(
      this.reportModel,
      id,
      updateReportDto,
    );

    if (!updated) {
      throw new NotFoundException('Report not found');
    }

    const populateFields: PopulateOptions[] = [
      { path: 'reporter' },
      { path: 'category' },
    ];

    const populated = await this.reportModel
      .findById(id)
      .populate(populateFields)
      .lean()
      .exec();

    return {
      message: 'Report updated successfully',
      updatedId: id,
      data: populated,
    };
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    await queryDeleteOne<Report>(this.reportModel, id);

    return {
      message: 'Report deleted successfully',
      deletedId: id,
    };
  }
}
