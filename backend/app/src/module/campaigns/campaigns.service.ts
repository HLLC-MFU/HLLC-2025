import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Campaign, CampaignDocument } from './schema/campaigns.schema';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class CampaignsService {
  constructor(@InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>) { }

  async create(createCampaignDto: CreateCampaignDto) {
    await throwIfExists(
      this.campaignModel,
      { name: createCampaignDto.name },
      'Campaign already exists',
    )

    const campaign = new this.campaignModel({
      ...createCampaignDto,
    });

    try {
      return await campaign.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name')
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Campaign>({
      model: this.campaignModel,
      query,
      filterSchema: {},
    })
  }

  async findOne(id: string) {
    return queryFindOne<Campaign>(this.campaignModel, { _id: id }, []);
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto) {
    updateCampaignDto.updatedAt = new Date();
    return queryUpdateOne<Campaign>(this.campaignModel, id, updateCampaignDto);
  }

  async remove(id: string) {
    await queryDeleteOne<Campaign>(this.campaignModel, id)
    return {
      message: 'Campaign deleted successfully',
      id,
    };
  }
}