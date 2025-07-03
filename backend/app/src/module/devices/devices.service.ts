import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { Model } from 'mongoose';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  registerOrUpdate(userId: string, dto: RegisterDeviceDto) {
    return this.deviceModel.findOneAndUpdate(
      { userId, deviceId: dto.deviceId },
      {
        ...dto,
        userId,
      },
      { upsert: true, new: true },
    );
  }

  revoke(userId: string, deviceId: string) {
    return this.deviceModel.deleteOne({ userId, deviceId });
  }

  findByUserId(userId: string) {
    return this.deviceModel.find({ userId });
  }

  findOne(id: string) {
    return this.deviceModel.findById(id);
  }

  findAll() {
    return this.deviceModel.find();
  }
}
