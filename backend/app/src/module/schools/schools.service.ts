import { Injectable } from '@nestjs/common';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from './schemas/school.schema';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryFindOne, queryUpdateOne, queryDeleteOne } from 'src/pkg/helper/query.util';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
  ) {}
  
  async create(createSchoolDto: CreateSchoolDto) {
    await throwIfExists(
      this.schoolModel,
       {name : createSchoolDto.name},
       'School already exists',
    );

    const school = new this.schoolModel({
      ...createSchoolDto,
    })

    try {
      return await school.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }



  async findAll(query: Record<string, string>) {
    return queryAll<School>({
      model: this.schoolModel,
      query,
      filterSchema: {},
      buildPopulateFields: (excluded) =>
        Promise.resolve(excluded.includes('majors') ? [] : [{ path: 'majors' }]),
    })
  }

  async findOne(id: string) {
    return queryFindOne<School>(this.schoolModel, { _id: id }, [
      { path: 'majors' },
    ]);
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    return queryUpdateOne<School>(this.schoolModel, id, updateSchoolDto);
  }

  async remove(id: string) {
    return queryDeleteOne<School>(this.schoolModel, id);
  }
}
