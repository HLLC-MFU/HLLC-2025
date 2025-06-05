import { Injectable } from '@nestjs/common';
import { CreateSponsorsTypeDto } from './dto/create-sponsors-type.dto';
import { UpdateSponsorsTypeDto } from './dto/update-sponsors-type.dto';
import { SponsorsType, SponsorsTypeDocument } from './schema/sponsors-type.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

@Injectable()
export class SponsorsTypeService {

  constructor(
    @InjectModel(SponsorsType.name)
    private sponsorsTypeModel: Model<SponsorsTypeDocument>
  ) {}

  async create(createSponsorsTypeDto: CreateSponsorsTypeDto) {
    await throwIfExists(
      this.sponsorsTypeModel,
      { name: createSponsorsTypeDto.name },
      'Sponsors type already exists',
    )

    const newSponsorsType = new this.sponsorsTypeModel({
      ...createSponsorsTypeDto,
    });

    try {
      return await newSponsorsType.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<SponsorsType>({
      model: this.sponsorsTypeModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<SponsorsType>(this.sponsorsTypeModel, { _id: id });
  }

  async update(id: string, updateSponsorsTypeDto: UpdateSponsorsTypeDto) {
    return await queryUpdateOne<SponsorsType>(this.sponsorsTypeModel, id, updateSponsorsTypeDto);
  }

  async remove(id: string) {
    await queryDeleteOne<SponsorsType>(this.sponsorsTypeModel, id);
    return {
      message: 'Sponsors type deleted successfully',
      id,
    };
  }
}
