import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { SponsorsType } from '../sponsors/schema/sponsors-type.schema';
import { SponsorsTypeSchema } from '../sponsors/schema/sponsors-type.schema';
import { EvoucherType, EvoucherTypeSchema } from './schema/evoucher-type.schema';
import { EvoucherTypeController } from './controller/evoucher-type.controller';
import { EvoucherTypeService } from './service/evoucher-type.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EvoucherType.name,
        schema: EvoucherTypeSchema
      },
      {
        name: SponsorsType.name,
        schema: SponsorsTypeSchema
      }
    ])
  ],
  exports: [MongooseModule],
  controllers: [EvoucherTypeController],
  providers: [EvoucherTypeService],
})
export class EvoucherTypeModule { }
