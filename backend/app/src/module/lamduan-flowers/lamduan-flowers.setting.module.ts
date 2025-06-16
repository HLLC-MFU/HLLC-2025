import { Module } from '@nestjs/common';
import { LamduanFlowersService } from './service/lamduan-flowers.service';
import { LamduanFlowersController } from './controller/lamduan-flowers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LamduanFlowersSetting, LamduanFlowersSettingSchema } from './schema/lamduan.setting';

@Module({
    imports: [MongooseModule.forFeature([
        {
            name: LamduanFlowersSetting.name,
            schema: LamduanFlowersSettingSchema
        }
    ]),
    ],
    exports: [MongooseModule],
    controllers: [LamduanFlowersController],
    providers: [LamduanFlowersService],
})
export class LamduanFlowersSettingModule { }
