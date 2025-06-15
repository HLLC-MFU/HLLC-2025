import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evoucher, EvoucherSchema } from './schema/evoucher.schema';
import { Sponsors } from '../sponsors/schema/sponsors.schema';
import { SponsorsSchema } from '../sponsors/schema/sponsors.schema';
import { EvoucherController } from './controller/evoucher.controller';
import { EvoucherService } from './service/evoucher.service';
import { EvoucherCode } from './schema/evoucher-code.schema';
import { EvoucherCodeSchema } from './schema/evoucher-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Evoucher.name,
        schema: EvoucherSchema
      },
      {
        name: Sponsors.name,
        schema: SponsorsSchema
      },
      {
        name: EvoucherCode.name,
        schema: EvoucherCodeSchema
      }
    ])
  ],
  exports: [MongooseModule],
  controllers: [EvoucherController],
  providers: [EvoucherService],
})
export class EvoucherModule { }
