import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVersionSettingDto } from './dto/update-version-setting.dto';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { VersionSetting, VersionSettingDocument } from './schema/version-setting.schema';
import { Model } from 'mongoose';
import { queryDeleteOne, queryFindOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';

@Injectable()
export class VersionSettingService {
  constructor(
    @InjectModel(VersionSetting.name) private readonly settingModel: Model<VersionSettingDocument>,
  ) {}

  async createOrUpdate(updateVersionSettingDto: UpdateVersionSettingDto): Promise<VersionSettingDocument> {
    return await queryUpdateOneByFilter<VersionSetting>(
      this.settingModel,
      {},
      { $set: updateVersionSettingDto },
      { upsert: true, runValidators: true }
    ) as VersionSettingDocument;
  }

  async find(): Promise<VersionSettingDocument> {
    const result = await queryFindOne<VersionSetting>(
      this.settingModel,
      {},
    );
    return result.data[0] as VersionSettingDocument;
  }

  async remove() {
    const doc = await this.settingModel.findOne().select('_id');
    if (!doc) throw new NotFoundException('Version setting not found');

    await queryDeleteOne<VersionSetting>(this.settingModel, doc._id.toString());
    return {
      message: 'Version setting deleted successfully',
    };
  }
}
