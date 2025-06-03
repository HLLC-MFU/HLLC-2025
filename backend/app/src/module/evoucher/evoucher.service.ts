import { Injectable } from '@nestjs/common';
import { CreateEvoucherDto } from './dto/create-evoucher.dto';
import { UpdateEvoucherDto } from './dto/update-evoucher.dto';

@Injectable()
export class EvoucherService {
  create(createEvoucherDto: CreateEvoucherDto) {
    return 'This action adds a new evoucher';
  }

  findAll() {
    return `This action returns all evoucher`;
  }

  findOne(id: number) {
    return `This action returns a #${id} evoucher`;
  }

  update(id: number, updateEvoucherDto: UpdateEvoucherDto) {
    return `This action updates a #${id} evoucher`;
  }

  remove(id: number) {
    return `This action removes a #${id} evoucher`;
  }
}
