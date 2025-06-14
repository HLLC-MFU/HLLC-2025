import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { Sponsors, SponsorsDocument } from 'src/module/sponsors/schema/sponsors.schema';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';

@Injectable()
export class EvoucherService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
  ) { }

  async create(createEvoucherDto: CreateEvoucherDto) {
    await findOrThrow(
      this.sponsorsModel,
      createEvoucherDto.sponsors,
      'Sponsors not found'
    )

    const evoucher = new this.evoucherModel({
      ...createEvoucherDto,
      sponsors: new Types.ObjectId(createEvoucherDto.sponsors),
      expiration: createEvoucherDto.expiration,
    });
    return await evoucher.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Evoucher>({
      model: this.evoucherModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { path: 'sponsors' },
      ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Evoucher>(
      this.evoucherModel,
      { _id: id },
      [
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
