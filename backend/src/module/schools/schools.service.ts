import { Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School } from './entities/school.entity';
import { SchoolDocument } from './schemas/school.schema';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
  ) {}
  async create(createSchoolDto: CreateSchoolDto) {
    return (await this.schoolModel.create(createSchoolDto)).toObject();
  }

  findAll() {
    return this.schoolModel.find().lean();
  }

  findOne(id: string) {
    return this.schoolModel.findById(id).lean();
  }

  update(id: string, updateSchoolDto: UpdateSchoolDto) {
    return this.schoolModel
      .findByIdAndUpdate(id, updateSchoolDto, { new: true })
      .lean();
  }

  remove(id: string) {
    return this.schoolModel.findByIdAndDelete(id).lean();
  }
}
