import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Report, ReportDocument } from './schemas/reports.schema';
import {
  ReportCategory,
  ReportCategoryDocument,
} from '../report_categories/schemas/report_categories.schemas';

import { CreateReportDto } from './dto/create-report.dto';

import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(ReportCategory.name)
    private readonly categoryModel: Model<ReportCategoryDocument>,
  ) { }

  async create(createReportDto: CreateReportDto) {
    await throwIfExists(
      this.reportModel,
      { massage: createReportDto.massage },
      'Massage already exists',
    );

    const report = new this.reportModel({
      ...createReportDto,
    });

    try {
      return await report.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  async findAll(query: Record<string, string>) {
    try {
      return await queryAll<Report>({
        model: this.reportModel,
        query: {
          ...query,
          excluded: [
            'reporter.password',
            'reporter.refreshToken',
            'reporter.role',
            'reporter.metadata',
            'reporter.createdAt',
            'reporter.updatedAt',
            'reporter.__v',
            '__v',
          ].join(',')
        },
        filterSchema: {},
        populateFields: (excluded) =>
          Promise.resolve(
            ['reporter', 'category']
              .filter(path => !excluded.includes(path))
              .map(path => ({ path }))
          ),
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }

  async findAllByCategory(categoryId: string) {
    try {
      const result = await queryAll<Report>({
        model: this.reportModel,
        query: {
          category: categoryId,
          excluded: [
            'reporter.password',
            'reporter.refreshToken',
            'reporter.role',
            'reporter.metadata',
            'reporter.createdAt',
            'reporter.updatedAt',
            'reporter.__v',
            '__v',
          ].join(',')
        } as Record<string, string>,
        filterSchema: { category: 'string' },
        populateFields: (e) =>
          Promise.resolve(
            ['reporter', 'category']
              .filter(p => !e.includes(p))
              .map(path => ({ path }))
          ),
      });

      return {
        category: result.data[0]?.category || await this.categoryModel.findById(categoryId),
        reports: result.data.map(({ category, ...rest }) => rest),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reports by category');
    }
  }

  async findOne(id: string): Promise<{ data: Report[] | null; message: string }> {

    const result = await queryFindOne(this.reportModel, { _id: id });
    if (!result) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }
    return result;

  }

  async update(id: string, updateReportDto: UpdateReportDto) {
    try {
      await findOrThrow(this.reportModel, { _id: id }, 'Report not found');

      updateReportDto.updatedAt = new Date();
      return await queryUpdateOne<Report>(this.reportModel, id, updateReportDto);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update report with id ${id}`);
    }
  }

  async remove(id: string) {
  try {
    await findOrThrow(this.reportModel, { _id: id }, 'Report not found');
    await queryDeleteOne<Report>(this.reportModel, id);

    return {
      message: 'Report deleted successfully',
      id,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error; 
    }
    throw new InternalServerErrorException(`Failed to delete report with id ${id}`);
  }
}

}
