import { Injectable } from '@nestjs/common';
import { CreateEvoucherTypeDto } from './dto/create-evoucher-type.dto';
import { UpdateEvoucherTypeDto } from './dto/update-evoucher-type.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EvoucherType, EvoucherTypeDocument } from './schema/evoucher-type.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

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
    )

    const evoucherType = new this.evoucherTypeModel({
      ...createEvoucherTypeDto,
    });

    return evoucherType.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<EvoucherType>({
      model: this.evoucherTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<EvoucherType>(
      this.evoucherTypeModel,
      { _id: id },
    );
  }

  async update(id: string, updateEvoucherTypeDto: UpdateEvoucherTypeDto) {
    return queryUpdateOne<EvoucherType>(
      this.evoucherTypeModel,
      id,
      updateEvoucherTypeDto,
    );
  }

  async remove(id: string) {
    return queryDeleteOne<EvoucherType>(
      this.evoucherTypeModel,
      id,
    );
  }
}
