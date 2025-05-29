import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';

// Entity & Document
import { Report, ReportDocument } from './schemas/reports.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  ReportCategory,
  ReportCategoryDocument,
} from '../report_categories/schemas/report_categories.schemas';

// DTO
import { CreateReportDto } from './dto/create-report.dto';

// Helpers
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
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
  ) { }

  async create(createReportDto: CreateReportDto) {
    await findOrThrow(
      this.userModel,
      createReportDto.reporter,
      'User not found',
    );
    await findOrThrow(
      this.categoryModel,
      createReportDto.category,
      'Category not found',
    );

    const report = new this.reportModel({
      ...createReportDto,
      reporter: new Types.ObjectId(createReportDto.reporter),
      category: new Types.ObjectId(createReportDto.category),
    });

    try {
      const saved = await report.save();

      const populateFields: PopulateOptions[] = [
        { path: 'reporter', select: userSelectFields },
        { path: 'category' },
      ];

      const populated = await this.reportModel
        .findById(saved._id)
        .populate(populateFields)
        .lean()
        .exec();

      return {
        message: 'Report created successfully',
        createdId: saved._id,
        data: populated,
      };
    } catch (error) {
      handleMongoDuplicateError(error, 'reporter');
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
      buildPopulateFields: () =>
        Promise.resolve([
          { path: 'reporter', select: userSelectFields },
          { path: 'category' },
        ]),
    });

    const reportsWithoutCategory = result.data.map(
      ({ category, ...rest }) => rest,
    );

    const category =
      result.data[0]?.category ||
      (await this.categoryModel.findById(categoryId));

    return {
      category,
      reports: reportsWithoutCategory,
    };
  }

  async findOne(id: string) {
    const populateFields: PopulateOptions[] = [
      { path: 'reporter', select: userSelectFields },
      { path: 'category' },
    ];
    return queryFindOne<Report>(this.reportModel, { _id: id });
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
      { path: 'reporter', select: userSelectFields },
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
