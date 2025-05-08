import { Injectable } from '@nestjs/common';
import { CreateActiviteDto } from './dto/create-activite.dto';
import { UpdateActiviteDto } from './dto/update-activite.dto';

@Injectable()
export class ActivitesService {
  create(createActiviteDto: CreateActiviteDto) {
    return 'This action adds a new activite';
  }

  findAll() {
    return `This action returns all activites`;
  }

  findOne(id: number) {
    return `This action returns a #${id} activite`;
  }

  update(id: number, updateActiviteDto: UpdateActiviteDto) {
    return `This action updates a #${id} activite`;
  }

  remove(id: number) {
    return `This action removes a #${id} activite`;
  }
}
