import { Injectable } from '@nestjs/common';
import { CreateMapDto } from '../dto/maps/create-map.dto';
import { UpdateMapDto } from '../dto/maps/update-map.dto';
import { MapDocument, Map } from '../schema/map.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class MapsService {
  constructor(
    @InjectModel(Map.name) private mapModel: Model<MapDocument>
  ) { }

  async create(createMapDto: CreateMapDto) {
    const map = new this.mapModel({
      ...createMapDto,
    })
    return await map.save();
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<Map>({
      model: this.mapModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    const result = await queryFindOne(this.mapModel, { _id: id });
    return result;
  }

  async update(id: string, updateMapDto: UpdateMapDto) {
    return await queryUpdateOne<Map>(this.mapModel, id, updateMapDto);
  }

  async remove(id: string) {
    await queryDeleteOne<Map>(this.mapModel, id);
    return {
      message: 'Map deleted successfully',
      id,
    }
  }
}
