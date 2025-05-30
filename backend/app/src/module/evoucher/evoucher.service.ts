import { Injectable } from '@nestjs/common';
import { CreateEvoucherDto } from './dto/create-evoucher.dto';
import { UpdateEvoucherDto } from './dto/update-evoucher.dto';
import { Evoucher, EvoucherDocument } from './schema/evoucher.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { SponsorsDocument } from '../sponsors/schema/sponsors.schema';
import { Sponsors } from '../sponsors/schema/sponsors.schema';
import { EvoucherTypeDocument } from '../evoucher-type/schema/evoucher-type.schema';
import { EvoucherType } from '../evoucher-type/schema/evoucher-type.schema';
import { Campaign, CampaignDocument } from '../campaigns/schema/campaigns.schema';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

@Injectable()
export class EvoucherService {

  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(EvoucherType.name)
    private evoucherTypeModel: Model<EvoucherTypeDocument>,
    @InjectModel(Campaign.name)
    private campaignModel: Model<CampaignDocument>
  ) {}

  async create(createEvoucherDto: CreateEvoucherDto) {
    
    await findOrThrow(
      this.evoucherTypeModel,
      createEvoucherDto.type,
      'Evoucher type not found'
    )

    await findOrThrow(
      this.sponsorsModel,
      createEvoucherDto.sponsors,
      'Sponsors not found'
    )

    await findOrThrow(
      this.campaignModel,
      createEvoucherDto.campaign,
      'Campaign not found'
    )

    const evoucher = new this.evoucherModel({
      ...createEvoucherDto,
      type: new Types.ObjectId(createEvoucherDto.type),
      sponsors: new Types.ObjectId(createEvoucherDto.sponsors),
      campaign: new Types.ObjectId(createEvoucherDto.campaign),
    });

    try {
      return await evoucher.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name')
    }
    
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Evoucher>({
      model: this.evoucherModel,
      query,
      filterSchema: {},
      buildPopulateFields: () =>
        Promise.resolve([{ path: 'type' }, { path: 'sponsors' }, { path: 'campaign' }]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Evoucher>(
      this.evoucherModel,
      { _id: id},
      [
        { path: 'type' },
        { path: 'sponsors' },
        { path: 'campaign' },
      ]
    )
  }

  async update(id: string, updateEvoucherDto: UpdateEvoucherDto) {
    return queryUpdateOne<Evoucher>(
      this.evoucherModel,
      id,
      updateEvoucherDto
    )
  }

  async remove(id: string) {
    await queryDeleteOne<Evoucher>(
      this.evoucherModel,
      id
    )
    return {
      message: 'Evoucher deleted successfully',
      id,
    }
  }
}
