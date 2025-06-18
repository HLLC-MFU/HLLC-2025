import { Injectable } from '@nestjs/common';
import { CreateInterfacesDto } from './dto/create-interfaces.dto';
import { UpdateInterfacesDto } from './dto/update-interfaces.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interfaces, InterfacesDocument } from './schema/interfaces.schema';

@Injectable()
export class InterfacesService {
  constructor(
    @InjectModel(Interfaces.name)
    private interfaceModel: Model<InterfacesDocument>
  ) { }

  create(createInterfacesDto: CreateInterfacesDto) {
    const createInterface = new this.interfaceModel(createInterfacesDto);
    return createInterface.save();
  }

  findAll() {
    return this.interfaceModel.find().populate('school').exec();
  }

  findOne(id: string) {
    return this.interfaceModel.findById(id).exec();
  }

  update(id: string, updateInterfacesDto: UpdateInterfacesDto) {
    return this.interfaceModel.findByIdAndUpdate(id, updateInterfacesDto).exec();
  }

  remove(id: string) {
    return this.interfaceModel.findByIdAndDelete(id).exec();
  }
}
