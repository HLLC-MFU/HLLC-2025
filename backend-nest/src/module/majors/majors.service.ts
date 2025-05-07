import { Injectable } from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major } from './entities/major.entity';
import { MajorDocument } from './schemas/major.schema';

@Injectable()
export class MajorsService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<MajorDocument>
  ) {}

  async create(createMajorDto: CreateMajorDto) {
    return (await this.majorModel.create(createMajorDto)).toObject();
  }

  findAll() {
    return this.majorModel.find().populate('school').lean();
  }

  findOne(id: string) {
    return this.majorModel.findById(id).populate('school').lean();
  }

  update(id: string, updateMajorDto: UpdateMajorDto) {
    return this.majorModel.findByIdAndUpdate(id, updateMajorDto, { new: true }).populate('school').lean();
  }

  remove(id: string) {
    return this.majorModel.findByIdAndDelete(id).populate('school').lean();
  }
}
