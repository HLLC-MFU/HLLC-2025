import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';

import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { Sponsors, SponsorsDocument } from 'src/module/sponsors/schema/sponsors.schema';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { EvoucherType, EvoucherTypeDocument } from '../schema/evoucher-type.schema';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';

@Injectable()
export class EvoucherService {

  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(EvoucherType.name)
    private evoucherTypeModel: Model<EvoucherTypeDocument>,
  ) { }

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
      expiration: createEvoucherDto.expiration,
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
      populateFields: () => Promise.resolve([
        { path: 'type' },
        { path: 'sponsors' },
      ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Evoucher>(
      this.evoucherModel,
      { _id: id },
      [
        { path: 'type' },
        { path: 'sponsors' },
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
