import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreateLamduanFlowerDto } from '../dto/lamduan-flower/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from '../dto/lamduan-flower/update-lamduan-flower.dto';
import {
  LamduanFlowers,
  LamduanFlowersDocument,
} from '../schema/lamduan-flowers.schema';
import {
  LamduanSetting,
  LamduanSettingDocument,
} from '../schema/lamduan.setting';
import {
  validateLamduanTime,
  validateUserAlreadySentLamduan,
} from '../utils/lamduan.utils';
import {
  Checkin,
  CheckinDocument,
} from 'src/module/checkin/schema/checkin.schema';
import {
  Activities,
  ActivityDocument,
} from 'src/module/activities/schemas/activities.schema';

@Injectable()
export class LamduanFlowersService {
  constructor(
    @InjectModel(LamduanFlowers.name)
    private lamduanflowersModel: Model<LamduanFlowersDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(LamduanSetting.name)
    private lamduanSetting: Model<LamduanSettingDocument>,

    @InjectModel(Checkin.name)
    private checkinModel: Model<CheckinDocument>,

    @InjectModel(Activities.name)
    private activityModel: Model<ActivityDocument>,
  ) { }

  async create(createLamduanFlowerDto: CreateLamduanFlowerDto) {
    await findOrThrow(
      this.userModel,
      createLamduanFlowerDto.user,
      'User Id not found',
    );
    await findOrThrow(
      this.lamduanSetting,
      createLamduanFlowerDto.setting,
      'Setting Id not found',
    );
    await validateLamduanTime(
      createLamduanFlowerDto.setting,
      this.lamduanSetting,
    );

    await validateUserAlreadySentLamduan(
      createLamduanFlowerDto.user,
      createLamduanFlowerDto.setting,
      this.lamduanflowersModel,
    );

    const lamduanFlowers = new this.lamduanflowersModel({
      ...createLamduanFlowerDto,
      user: new Types.ObjectId(createLamduanFlowerDto.user),
      setting: new Types.ObjectId(createLamduanFlowerDto.setting),
    });
    const activity = await this.activityModel.findOne({
      'name.en': { $regex: '^Lamduan Flowers$', $options: 'i' },
    });

    if (!activity) {
      throw new Error('Activity "Lamduan Flowers" not found');
    }

    const checkin = new this.checkinModel({
      user: new Types.ObjectId(createLamduanFlowerDto.user),
      staff: new Types.ObjectId(createLamduanFlowerDto.user),
      activity: new Types.ObjectId(activity._id),
    });

    await checkin.save();
    return await lamduanFlowers.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<LamduanFlowers>({
      model: this.lamduanflowersModel,
      query: { ...query },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {
            path: 'user',
            select: '-name -role -metadata -createdAt -updatedAt',
          },
          { path: 'setting' },
        ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<LamduanFlowers>(this.lamduanflowersModel, { _id: id }, [
      { path: 'user' },
    ]);
  }

  async update(id: string, updateLamduanFlowerDto: UpdateLamduanFlowerDto) {
    const userId = new Types.ObjectId(updateLamduanFlowerDto.user);
    const settingId = new Types.ObjectId(updateLamduanFlowerDto.setting);

    const lamduanFlowers = {
      ...updateLamduanFlowerDto,
      user: userId,
      setting: settingId,
    };

    const activity = await this.activityModel.findOne({
      'name.en': { $regex: '^Lamduan Flowers$', $options: 'i' },
    });

    if (!activity) {
      throw new Error('Activity "Lamduan Flowers" not found');
    }

    // ตรวจสอบว่ามี checkin อยู่แล้วหรือยัง
    const existingCheckin = await this.checkinModel.findOne({
      user: userId,
      activity: activity._id,
    });

    if (!existingCheckin) {
      const newCheckin = new this.checkinModel({
        user: userId,
        staff: userId,
        activity: activity._id,
      });
      await newCheckin.save();
    }

    // อัปเดตดอกลำดวน
    return queryUpdateOne<LamduanFlowers>(
      this.lamduanflowersModel,
      id,
      lamduanFlowers,
    );
  }

  async remove(id: string) {
    const lamduan = await this.lamduanflowersModel.findById(id);
    if (!lamduan) throw new Error('LamduanFlowers entry not found');

    // Get the activity ID for "Lamduan Flowers"
    const activity = await this.activityModel.findOne({
      'name.en': { $regex: '^Lamduan Flowers$', $options: 'i' },
    });

    if (activity) {
      await this.checkinModel.deleteOne({
        user: lamduan.user,
        activity: activity._id,
      });
    }
    return queryDeleteOne<LamduanFlowers>(this.lamduanflowersModel, id);
  }
}
