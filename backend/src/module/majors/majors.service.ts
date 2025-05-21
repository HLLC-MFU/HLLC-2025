import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major, MajorDocument } from './schemas/major.schema';
import { School } from '../schools/schemas/school.schema';
import { SchoolDocument } from '../schools/schemas/school.schema';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { Types } from 'mongoose';

@Injectable()
export class MajorsService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>,
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>
  ) {}


  async create(createMajorDto: CreateMajorDto) {
    await throwIfExists(
      this.majorModel,
      { name: createMajorDto.name },
      'Major already exists', 
    );

    await findOrThrow(this.schoolModel, createMajorDto.school, 'School not found');

    const major = new this.majorModel({
      ...createMajorDto,
      school: new Types.ObjectId(createMajorDto.school),
    })
    
    try {
      return await major.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  findAll() {
    return this.majorModel.find().populate('school').lean();
  }

  findOne(id: string) {
    return this.majorModel.findById(id).populate('school').lean();
  }

  update(id: string, updateMajorDto: UpdateMajorDto) {
    return this.majorModel
      .findByIdAndUpdate(id, updateMajorDto, { new: true })
      .populate('school')
      .lean();
  }

  remove(id: string) {
    return this.majorModel.findByIdAndDelete(id).populate('school').lean();
  }
}
