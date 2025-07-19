import { Module } from '@nestjs/common';
import { VersionSettingService } from './version-setting.service';
import { VersionSettingController } from './version-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { VersionSetting, VersionSettingSchema } from './schema/version-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VersionSetting.name, schema: VersionSettingSchema }
    ]),
  ],
  controllers: [VersionSettingController],
  providers: [VersionSettingService],
})
export class VersionSettingModule {}
