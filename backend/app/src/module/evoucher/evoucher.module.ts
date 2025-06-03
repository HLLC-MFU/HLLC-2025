import { Module } from '@nestjs/common';
import { EvoucherService } from './evoucher.service';
import { EvoucherController } from './evoucher.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Evoucher, EvoucherSchema } from './schema/evoucher.schema';
import { EvoucherType, EvoucherTypeSchema } from '../evoucher-type/schema/evoucher-type.schema';
import { Sponsors } from '../sponsors/schema/sponsors.schema';
import { SponsorsSchema } from '../sponsors/schema/sponsors.schema';
import { Campaign, CampaignSchema } from '../campaigns/schema/campaigns.schema';

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
      {
        name: Campaign.name,
        schema: CampaignSchema
      }
    ])
  ],
  exports: [MongooseModule],
  controllers: [EvoucherController],
  providers: [EvoucherService],
})
export class EvoucherModule {}
