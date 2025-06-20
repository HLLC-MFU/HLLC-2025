import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreateLamduanFlowerDto } from '../dto/lamduan-flower/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from '../dto/lamduan-flower/update-lamduan-flower.dto';
import { LamduanFlowers, LamduanFlowersDocument } from '../schema/lamduan-flowers.schema';
import { LamduanSetting, LamduanSettingDocument } from '../schema/lamduan.setting';
import { validateLamduanTime, validateUserAlreadySentLamduan } from '../utils/lamduan.utils';

@Injectable()
export class LamduanFlowersService {

  constructor(
    @InjectModel(LamduanFlowers.name)
    private lamduanflowersModel: Model<LamduanFlowersDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(LamduanSetting.name)
    private lamduanSetting: Model<LamduanSettingDocument>
  ) { }

  async create(createLamduanFlowerDto: CreateLamduanFlowerDto) {
    await findOrThrow(this.userModel, createLamduanFlowerDto.user, 'User Id not found');
    await findOrThrow(this.lamduanSetting, createLamduanFlowerDto.setting, 'Setting Id not found');
    await validateLamduanTime(createLamduanFlowerDto.setting, this.lamduanSetting);

    await validateUserAlreadySentLamduan(
      createLamduanFlowerDto.user,
      createLamduanFlowerDto.setting,
      this.lamduanflowersModel
    );

    const lamduanFlowers = new this.lamduanflowersModel({
      ...createLamduanFlowerDto,
      user: new Types.ObjectId(createLamduanFlowerDto.user),
      setting: new Types.ObjectId(createLamduanFlowerDto.setting),
    });

    return await lamduanFlowers.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<LamduanFlowers>({
      model: this.lamduanflowersModel,
      query: { ...query },
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { path: 'user', select: '-name -role -metadata -createdAt -updatedAt' },
        { path: 'setting' },
      ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<LamduanFlowers>(
      this.lamduanflowersModel,
      { _id: id },
      [{ path: 'user' }],
    );
  }

  async update(id: string, updateLamduanFlowerDto: UpdateLamduanFlowerDto) {
    return queryUpdateOne<LamduanFlowers>(
      this.lamduanflowersModel,
      id,
      updateLamduanFlowerDto,
    );
  }

  async remove(id: string) {
    return queryDeleteOne<LamduanFlowers>(
      this.lamduanflowersModel,
      id,
    );
  }
}
