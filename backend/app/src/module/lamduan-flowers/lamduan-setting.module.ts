import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LamduanSetting, LamduanSettingSchema } from './schema/lamduan.setting';
import { LamduanSettingController } from './controller/lamduan-setting.controller';
import { LamduanSettingService } from './service/lamduan-setting.service';

@Module({
    imports: [MongooseModule.forFeature([
        {
            name: LamduanSetting.name,
            schema: LamduanSettingSchema
        }
    ]),
    ],
    exports: [MongooseModule],
    controllers: [LamduanSettingController],
    providers: [LamduanSettingService],
})
export class LamduanSettingModule { }
