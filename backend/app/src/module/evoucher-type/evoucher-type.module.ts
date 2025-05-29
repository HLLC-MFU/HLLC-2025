import { Module } from '@nestjs/common';
import { EvoucherTypeService } from './evoucher-type.service';
import { EvoucherTypeController } from './evoucher-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EvoucherType, EvoucherTypeSchema } from './schema/evoucher-type.schema';
import { SponsorsType } from '../sponsors-type/schema/sponsors-type.schema';
import { SponsorsTypeSchema } from '../sponsors-type/schema/sponsors-type.schema';

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
export class EvoucherTypeModule {}
