import { Injectable } from '@nestjs/common';
import { CreateTimeSettingDto } from './dto/create-time-setting.dto';
import { UpdateTimeSettingDto } from './dto/update-time-setting.dto';
import { InjectModel } from '@nestjs/mongoose';
import { TimeSetting, TimeSettingDocument } from './schema/time-setting.schema';
import { Model } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class TimeSettingService {
  constructor(@InjectModel(TimeSetting.name) private timeSettingModel: Model<TimeSettingDocument>
  ) {}

  async create(createTimeSettingDto: CreateTimeSettingDto) {
    const timeSetting = new this.timeSettingModel({
      ...createTimeSettingDto,
    })
    return await timeSetting.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<TimeSetting>({
      model: this.timeSettingModel,
      query,
      filterSchema: {},

    });
  }
  async findOne(
    id: string,
  ): Promise<{ data: TimeSetting[] | null; message: string }> {
    const result = await queryFindOne(this.timeSettingModel, { _id: id });
    return result;
  }

  async update(id: string, updateTimeSettingDto: UpdateTimeSettingDto) {
    return await queryUpdateOne<TimeSetting>(this.timeSettingModel, id, updateTimeSettingDto)
  }

  async remove(id: string) {
    await queryDeleteOne<TimeSetting>(this.timeSettingModel, id)
    return {
      message: 'Time setting deleted successfully',
      id,
    };
  }
}
