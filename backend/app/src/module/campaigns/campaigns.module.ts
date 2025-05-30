import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';

@Module({
  imports: [MongooseModule.forFeature([{
    name: Campaign.name, schema: CampaignSchema
  }])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [MongooseModule]
})
export class CampaignsModule { }
