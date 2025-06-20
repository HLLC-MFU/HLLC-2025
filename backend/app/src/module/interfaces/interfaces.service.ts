import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInterfacesDto } from './dto/create-interfaces.dto';
import { UpdateInterfacesDto } from './dto/update-interfaces.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interfaces, InterfacesDocument } from './schema/interfaces.schema';

@Injectable()
export class InterfacesService {
  constructor(
    @InjectModel(Interfaces.name)
    private interfaceModel: Model<InterfacesDocument>,
  ) {}

  async create(createInterfacesDto: CreateInterfacesDto) {
    const createInterface = new this.interfaceModel(createInterfacesDto);
    return createInterface.save();
  }

  async findAll() {
    return this.interfaceModel.find().populate('school').lean();
  }

  async findOne(id: string) {
    return this.interfaceModel.findById(id).lean();
  }

  async update(id: string, updateInterfacesDto: Partial<UpdateInterfacesDto>) {
    const originalInterface = await this.interfaceModel.findById(id);

    if (!originalInterface) throw new NotFoundException();

    if (updateInterfacesDto.assets) {
      updateInterfacesDto.assets = {
        ...originalInterface.assets,
        ...updateInterfacesDto.assets,
      };
    }

    return this.interfaceModel
      .findByIdAndUpdate(id, updateInterfacesDto, { new: true })
      .lean();
  }

  async remove(id: string) {
    return this.interfaceModel.findByIdAndDelete(id).lean();
  }
}
