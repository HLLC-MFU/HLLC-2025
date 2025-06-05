import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evoucher, EvoucherSchema } from './schema/evoucher.schema';
import { Sponsors } from '../sponsors/schema/sponsors.schema';
import { SponsorsSchema } from '../sponsors/schema/sponsors.schema';
import { EvoucherController } from './controller/evoucher.controller';
import { EvoucherType, EvoucherTypeSchema } from './schema/evoucher-type.schema';
import { EvoucherService } from './service/evoucher.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Evoucher.name,
        schema: EvoucherSchema
      },
      {
        name: EvoucherType.name,
        schema: EvoucherTypeSchema
      },
      {
        name: Sponsors.name,
        schema: SponsorsSchema
      },
    ])
  ],
  exports: [MongooseModule],
  controllers: [EvoucherController],
  providers: [EvoucherService],
})
export class EvoucherModule { }
