import { Injectable } from '@nestjs/common';
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
import {
  Interfaces,
  InterfacesDocument,
} from '../interfaces/schema/interfaces.schema';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    @InjectModel(Appearance.name)
    private AppearanceModel: Model<AppearanceDocument>,
    @InjectModel(Interfaces.name)
    private InterfacesModel: Model<InterfacesDocument>,
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
    return queryUpdateOne<School>(this.schoolModel, id, updateSchoolDto);
  }

  async remove(id: string) {
    await queryDeleteOne<School>(this.schoolModel, id);
    return {
      message: 'School deleted successfully',
      id,
    };
  }

  async findColor(schoolId: string, query: Record<string, string>) {
    return queryFindOne<Appearance>(
      this.AppearanceModel,
      { school: schoolId },
      [{ path: 'school' }],
    );
  }

  async findInterfaces(schoolId: string) {
    return queryFindOne<Interfaces>(
      this.InterfacesModel,
      { school: schoolId },
      [{ path: 'school' }],
    );
  }
}
