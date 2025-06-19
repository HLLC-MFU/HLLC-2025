import { Injectable } from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major, MajorDocument } from './schemas/major.schema';
import { School } from '../schools/schemas/school.schema';
import { SchoolDocument } from '../schools/schemas/school.schema';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { Types } from 'mongoose';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';

@Injectable()
export class MajorsService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
  ) {}

  async create(createMajorDto: CreateMajorDto) {
    await throwIfExists(
      this.majorModel,
      { name: createMajorDto.name },
      'Major already exists',
    );

    await findOrThrow(
      this.schoolModel,
      createMajorDto.school,
      'School not found',
    );

    const major = new this.majorModel({
      ...createMajorDto,
      school: new Types.ObjectId(createMajorDto.school),
    });

    return await major.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Major>({
      model: this.majorModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'school' }]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Major>(this.majorModel, { _id: id }, [
      { path: 'school' },
    ]);
  }

  async update(id: string, updateMajorDto: UpdateMajorDto) {
    return queryUpdateOne<Major>(this.majorModel, id, updateMajorDto);
  }

  async remove(id: string) {
    return queryDeleteOne<Major>(this.majorModel, id);
  }
}
