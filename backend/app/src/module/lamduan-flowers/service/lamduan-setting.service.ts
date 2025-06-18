import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { CreateLamduanSettingDto } from '../dto/lamduan-settings/create-lamduan-setting.dto';
import { UpdateLamduanSettingDto } from '../dto/lamduan-settings/update-lamduan-setting.dto';
import { LamduanSetting, LamduanSettingDocument } from '../schema/lamduan.setting';

@Injectable()
export class LamduanSettingService {
  constructor(
    @InjectModel(LamduanSetting.name)
    private lamduanSettingModel: Model<LamduanSettingDocument>,
  ) { }

  async create(createLamduanSettingDto: CreateLamduanSettingDto) {
    const lamduanSetting = new this.lamduanSettingModel(createLamduanSettingDto);
    return await lamduanSetting.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<LamduanSetting>({
      model: this.lamduanSettingModel,
      query: { ...query },
      filterSchema: {},
      populateFields: () => Promise.resolve([]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<LamduanSetting>(
      this.lamduanSettingModel,
      { _id: id },
      []
    );
  }

  async update(id: string, updateLamduanSettingDto: UpdateLamduanSettingDto) {
    return queryUpdateOne<LamduanSetting>(
      this.lamduanSettingModel,
      id,
      updateLamduanSettingDto
    );
  }

  async remove(id: string) {
    return queryDeleteOne<LamduanSetting>(
      this.lamduanSettingModel,
      id
    );
  }
}
