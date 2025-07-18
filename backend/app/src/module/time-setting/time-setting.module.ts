import { Module } from '@nestjs/common';
import { TimeSettingService } from './time-setting.service';
import { TimeSettingController } from './time-setting.controller';
import { TimeSetting, TimeSettingSchema } from './schema/time-setting.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: TimeSetting.name,
      schema: TimeSettingSchema
    }
  ])],
  controllers: [TimeSettingController],
  providers: [TimeSettingService],
})
export class TimeSettingModule { }
