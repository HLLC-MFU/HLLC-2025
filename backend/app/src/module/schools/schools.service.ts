import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from './schemas/school.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
  queryUpdateOne,
  queryDeleteOne,
} from 'src/pkg/helper/query.util';
import {
  Appearance,
  AppearanceDocument,
} from '../appearances/schemas/apprearance.schema';
@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(School.name)
    private schoolModel: Model<SchoolDocument>,
    @InjectModel(Appearance.name)
    private AppearanceModel: Model<AppearanceDocument>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto) {
    await throwIfExists(
      this.schoolModel,
      { name: createSchoolDto.name },
      'School already exists',
    );

    const school = new this.schoolModel({
      ...createSchoolDto,
    });
    return await school.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<School>({
      model: this.schoolModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'majors' }]),
    });
  }

  async findOne(
    id: string,
  ): Promise<{ data: School[] | null; message: string }> {
    const result = await queryFindOne(this.schoolModel, { _id: id });
    return result;
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    const originSchool = await this.schoolModel.findById(id).lean();
    if (!originSchool) throw new NotFoundException('School not found');

    if (updateSchoolDto.photos) {
      updateSchoolDto.photos = {
        ...originSchool.photos,
        ...updateSchoolDto.photos,
      }
    }

    const updatedSchool = await this.schoolModel.findByIdAndUpdate(
      id,
      { $set: updateSchoolDto },
      { new: true },
    );
    if (!updatedSchool) throw new NotFoundException('Updated school not found')

    return updatedSchool;
  }

  async remove(id: string) {
    await queryDeleteOne<School>(this.schoolModel, id);
    return {
      message: 'School deleted successfully',
      id,
    };
  }

  async findAppearance(schoolId: string, query: Record<string, string>) {
    return queryFindOne<Appearance>(
      this.AppearanceModel,
      { school: schoolId },
      [{ path: 'school' }],
    );
  }
}
