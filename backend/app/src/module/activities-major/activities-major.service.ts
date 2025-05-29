import { Injectable } from '@nestjs/common';
import { CreateActivitiesMajorDto } from './dto/create-activities-major.dto';
import { UpdateActivitiesMajorDto } from './dto/update-activities-major.dto';

@Injectable()
export class ActivitiesMajorService {
  create(createActivitiesMajorDto: CreateActivitiesMajorDto) {
    return 'This action adds a new activitiesMajor';
  }

  findAll() {
    return `This action returns all activitiesMajor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} activitiesMajor`;
  }

  update(id: number, updateActivitiesMajorDto: UpdateActivitiesMajorDto) {
    return `This action updates a #${id} activitiesMajor`;
  }

  remove(id: number) {
    return `This action removes a #${id} activitiesMajor`;
  }
}
