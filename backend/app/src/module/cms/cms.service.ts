import { Injectable } from '@nestjs/common';
import { CreateCmsDto } from './dto/create-cms.dto';
import { UpdateCmsDto } from './dto/update-cms.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CMS, CmsDocument } from './schema/cms.schema';
import { Model } from 'mongoose';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(CMS.name)
    private cmsModel: Model<CmsDocument>
  ) { }

  create(createCmsDto: CreateCmsDto) {
    const createCms = new this.cmsModel(createCmsDto);
    return createCms.save();
  }

  findAll() {
    return this.cmsModel.find();
  }

  findOne(id: string) {
    return this.cmsModel.findById(id);
  }

  update(id: string, updateCmsDto: UpdateCmsDto) {
    return this.cmsModel.findByIdAndUpdate(id, updateCmsDto);
  }

  remove(id: string) {
    return this.cmsModel.findByIdAndDelete(id);
  }
}
