import { Injectable } from '@nestjs/common';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Appearance, ApprearanceDocument } from './schemas/apprearance.schema';
import { Model } from 'mongoose';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';


@Injectable()
export class AppearancesService {
  constructor(@InjectModel(Appearance.name) private apprearanceModel: Model<ApprearanceDocument>) { }

  async create(createAppearanceDto: CreateAppearanceDto) {
    await throwIfExists(
      this.apprearanceModel,
      { school: createAppearanceDto.school },
      'School already exists',
    );

    const apprearance = new this.apprearanceModel({
      ...createAppearanceDto,
    });
    try {
      return await apprearance.save()
    } catch (error) {
      handleMongoDuplicateError(error, 'school');
    }

  }

  async findAll(query: Record<string, string>) {
    return queryAll<Appearance>({
      model: this.apprearanceModel,
      query,
      filterSchema: {},
      populateFields: (exclude) =>
        Promise.resolve(
          exclude.includes('school') ? [] : [{ path: 'school' }]
        )
    })
  }

  async findOne(id: string) {
    return queryFindOne<Appearance>(this.apprearanceModel, { _id: id }, [{path:'school'}]);
  }

  async update(id: string, updateAppearanceDto: UpdateAppearanceDto) {
    await queryUpdateOne<Appearance>(this.apprearanceModel, id, updateAppearanceDto);
    return this.apprearanceModel.findById(id).populate('school').exec();
  }

  async remove(id: string) {
    await queryDeleteOne<Appearance>(this.apprearanceModel, id);
    return {
      message: 'Appearance delete successfully',
    }
  }
}
