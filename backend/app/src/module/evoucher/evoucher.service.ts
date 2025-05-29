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

@Injectable()
export class EvoucherService {

  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(EvoucherType.name)
    private evoucherTypeModel: Model<EvoucherTypeDocument>
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

    const evoucher = new this.evoucherModel({
      ...createEvoucherDto,
      type: new Types.ObjectId(createEvoucherDto.type),
      sponsors: new Types.ObjectId(createEvoucherDto.sponsors),
    });

    return evoucher.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Evoucher>({
      model: this.evoucherModel,
      query,
      filterSchema: {},
      buildPopulateFields: () =>
        Promise.resolve([{ path: 'type' }, { path: 'sponsors' }]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Evoucher>(
      this.evoucherModel,
      { _id: id},
      [
        { path: 'type' },
        { path: 'sponsors' }
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
    return queryDeleteOne<Evoucher>(
      this.evoucherModel,
      id
    )
  }
}
