import { Injectable } from '@nestjs/common';
import { CreateLamduanFlowerDto } from './dto/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from './dto/update-lamduan-flower.dto';

@Injectable()
export class LamduanFlowersService {
  create(createLamduanFlowerDto: CreateLamduanFlowerDto) {
    return 'This action adds a new lamduanFlower';
  }

  findAll() {
    return `This action returns all lamduanFlowers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lamduanFlower`;
  }

  update(id: number, updateLamduanFlowerDto: UpdateLamduanFlowerDto) {
    return `This action updates a #${id} lamduanFlower`;
  }

  remove(id: number) {
    return `This action removes a #${id} lamduanFlower`;
  }
}
