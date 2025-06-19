import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { LamduanSettingDocument } from '../schema/lamduan.setting';
import { LamduanFlowersDocument } from '../schema/lamduan-flowers.schema';

export async function validateLamduanTime(
  settingId: string,
  lamduanModel: Model<LamduanSettingDocument>
) {
  const lamduan = await lamduanModel.findById(settingId);
  if (!lamduan) throw new BadRequestException('Lamduan setting not found');

  const now = new Date();

  if (now < new Date(lamduan.startAt)) {
    throw new BadRequestException('Not time to send Lamduan yet.');
  }

  if (now > new Date(lamduan.endAt)) {
    throw new BadRequestException('Out of time to sent Lamduan');
  }

  return lamduan;
}

export async function validateUserAlreadySentLamduan(
  userId: string,
  settingId: string,
  lamduanModel: Model<LamduanFlowersDocument>
): Promise<void> {
  const exists = await lamduanModel.findOne({
    user: new Types.ObjectId(userId),
    setting: new Types.ObjectId(settingId),
  });

  if (exists) {
    throw new BadRequestException('You already sent Lamduan for this setting.');
  }
}
