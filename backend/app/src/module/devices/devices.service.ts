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

  async registerOrUpdate(userId: string, dto: RegisterDeviceDto) {
    // Remove same fcm Token (1 fcm to 1 device) 
    await this.deviceModel.deleteMany({ fcmToken: dto.fcmToken });

    //Remove same device Id (1 device to 1 user)
    await this.deviceModel.deleteMany({
      deviceId: dto.deviceId,
      userId: { $ne: userId },
    });

    return await this.deviceModel.findOneAndUpdate(
      { userId, deviceId: dto.deviceId },
      { ...dto, userId },
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
