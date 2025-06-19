import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportTypeDto } from '../dto/reports-type/create-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ReportType, ReportTypeDocument } from '../schemas/report-type.schema';
import { Model } from 'mongoose';
import {
  queryDeleteOne,
  queryFindOne,
  queryAll,
} from 'src/pkg/helper/query.util';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { UpdateReportTypeDto } from '../dto/reports-type/update-type.dto';

@Injectable()
export class ReportTypeService {
  constructor(
    @InjectModel(ReportType.name)
    private readonly reportTypeModel: Model<ReportTypeDocument>,
  ) {}

  async create(createReportTypeDto: CreateReportTypeDto) {
    await throwIfExists(
      this.reportTypeModel,
      {
        'name.th': createReportTypeDto.name.th,
        'name.en': createReportTypeDto.name.en,
      },
      'Report type already exists',
    );

    const category = new this.reportTypeModel(createReportTypeDto);

    return await category.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<ReportType>({
      model: this.reportTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<ReportType>(this.reportTypeModel, { _id: id });
  }

  async update(id: string, updateReportTypeDto: UpdateReportTypeDto) {
    if (updateReportTypeDto.name) {
      await throwIfExists(
        this.reportTypeModel,
        {
          _id: { $ne: id },
          'name.th': updateReportTypeDto.name.th,
          'name.en': updateReportTypeDto.name.en,
        },
        'Report type with this name already exists',
      );
    }

    const updated = await this.reportTypeModel
      .findByIdAndUpdate(id, updateReportTypeDto, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Report type not found');
    }

    return {
      message: 'Report type updated successfully',
      data: updated,
    };
  }

  async remove(id: string): Promise<void> {
    await queryDeleteOne<ReportType>(this.reportTypeModel, id);
  }
}
