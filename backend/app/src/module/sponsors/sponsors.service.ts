import { Injectable } from '@nestjs/common';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorsDocument } from './schema/sponsors.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Sponsors } from './schema/sponsors.schema';
import { SponsorsType } from '../sponsors-type/schema/sponsors-type.schema';
import { SponsorsTypeDocument } from '../sponsors-type/schema/sponsors-type.schema';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { queryAll, queryFindOne } from 'src/pkg/helper/query.util';
import { EvoucherCode } from '../evouchers/schemas/evoucher-code.schema';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(SponsorsType.name)
    private sponsorsTypeModel: Model<SponsorsTypeDocument>,
    @InjectModel(EvoucherCode.name)
    private evoucherCodeModel: Model<EvoucherCode>,
  ) {}

  async create(createSponsorDto: CreateSponsorDto) {
    await findOrThrow(
      this.sponsorsTypeModel,
      createSponsorDto.type,
      'Sponsors type not found',
    );

    const newSponsor = new this.sponsorsModel({
      ...createSponsorDto,
      metadata: createSponsorDto.metadata,
      type: new Types.ObjectId(createSponsorDto.type),
    });

    return await newSponsor.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<Sponsors>({
      model: this.sponsorsModel,
      query,
      filterSchema: {},
      populateFields: (excluded) =>
        Promise.resolve(excluded.includes('type') ? [] : [{ path: 'type' }]),
    });
  }

  async findOne(_id: string) {
    return await queryFindOne<Sponsors>(this.sponsorsModel, { _id }, [
      { path: 'type' },
    ]);
  }

  async update(_id: string, updateSponsorDto: UpdateSponsorDto) {
    await findOrThrow(this.sponsorsModel, _id, 'Sponsor not found');

    await findOrThrow(
      this.sponsorsTypeModel,
      updateSponsorDto.type || '',
      'Sponsors type not found',
    );

    return await this.sponsorsModel.findByIdAndUpdate(_id, updateSponsorDto, {
      new: true,
    });
  }

  async remove(_id: string) {
    await findOrThrow(this.sponsorsModel, _id, 'Sponsor not found');

    return await this.sponsorsModel.findByIdAndDelete(_id);
  }

  async findEvoucherCodesBySponsorId(
    sponsorId: string,
    query: Record<string, string>,
  ) {
    const res = await this.evoucherCodeModel
      .find(query)
      .populate({
        path: 'evoucher',
        match: { sponsors: new Types.ObjectId(sponsorId) },
        populate: { path: 'sponsors' },
      })
      .populate('user')
      .then((results) => results.filter((code) => code.evoucher));
    return res;
  }
}
