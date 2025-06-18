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
import { queryAll, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { queryDeleteOne } from 'src/pkg/helper/query.util';

@Injectable()
export class SponsorsService {

  constructor(
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(SponsorsType.name)
    private sponsorsTypeModel: Model<SponsorsTypeDocument>
  ) {}

  async create(createSponsorDto: CreateSponsorDto) {

    await findOrThrow(
      this.sponsorsTypeModel,
      createSponsorDto.type,
      'Sponsors type not found'
    )

    const newSponsor = new this.sponsorsModel({
      ...createSponsorDto,
      metadata: createSponsorDto.metadata,
      type: new Types.ObjectId(createSponsorDto.type)
    })

    return await newSponsor.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<Sponsors>({
      model: this.sponsorsModel,
      query,
      filterSchema: {},
      populateFields: excluded =>
        Promise.resolve(excluded.includes('type') ? [] : [{ path: 'type' }]),
    })
  }

  findOne(id: string) {
    return queryFindOne<Sponsors>(this.sponsorsModel, { _id: id }, [
      { path: 'type' }
    ]);
  }

  update(id: string, updateSponsorDto: UpdateSponsorDto) {
    return queryUpdateOne<Sponsors>(this.sponsorsModel, id, updateSponsorDto);
  }

  async remove(id: string) {
    await queryDeleteOne<Sponsors>(this.sponsorsModel, id);
    return {
      message: 'Sponsor deleted successfully',
      id,
    };
  }
}
