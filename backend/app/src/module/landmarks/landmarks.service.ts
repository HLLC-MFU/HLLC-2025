import { Injectable } from '@nestjs/common';
import { CreateLandmarkDto } from './dto/create-landmark.dto';
import { UpdateLandmarkDto } from './dto/update-landmark.dto';
import { Model } from 'mongoose';
import { Landmark, LandmarkDocument } from './schema/landmark.schema';
import { InjectModel } from '@nestjs/mongoose';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class LandmarksService {
  constructor(
    @InjectModel(Landmark.name) private landmarkModel: Model<LandmarkDocument>
  ) { }

  async create(createLandmarkDto: CreateLandmarkDto) {
    const landmark = new this.landmarkModel({
      ...createLandmarkDto
    })
    try {
      return await landmark.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name')
    }
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<Landmark>({
      model: this.landmarkModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return await queryFindOne<Landmark>(this.landmarkModel, { _id: id },);
  }

  async update(id: string, updateLandmarkDto: UpdateLandmarkDto) {
    return await queryUpdateOne<Landmark>(this.landmarkModel, id, updateLandmarkDto);
  }

  async remove(id: string) {
    return await queryDeleteOne<Landmark>(this.landmarkModel, id,);
  }
}
