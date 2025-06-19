import { Injectable } from '@nestjs/common';

import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import {
  EvoucherType,
  EvoucherTypeDocument,
} from '../schema/evoucher-type.schema';
import { CreateEvoucherTypeDto } from '../dto/evoucher-types/create-evoucher-type.dto';
import { UpdateEvoucherTypeDto } from '../dto/evoucher-types/update-evoucher-type.dto';

@Injectable()
export class EvoucherTypeService {
  constructor(
    @InjectModel(EvoucherType.name)
    private evoucherTypeModel: Model<EvoucherTypeDocument>,
  ) {}

  async create(createEvoucherTypeDto: CreateEvoucherTypeDto) {
    await throwIfExists(
      this.evoucherTypeModel,
      { name: createEvoucherTypeDto.name },
      'Evoucher type already exists',
    );

    const evoucherType = new this.evoucherTypeModel({
      ...createEvoucherTypeDto,
    });

    try {
      return await evoucherType.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<EvoucherType>({
      model: this.evoucherTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<EvoucherType>(this.evoucherTypeModel, { _id: id });
  }

  async update(id: string, updateEvoucherTypeDto: UpdateEvoucherTypeDto) {
    return queryUpdateOne<EvoucherType>(
      this.evoucherTypeModel,
      id,
      updateEvoucherTypeDto,
    );
  }

  async remove(id: string) {
    await queryDeleteOne<EvoucherType>(this.evoucherTypeModel, id);
    return {
      message: 'Evoucher type deleted successfully',
      id,
    };
  }
}
