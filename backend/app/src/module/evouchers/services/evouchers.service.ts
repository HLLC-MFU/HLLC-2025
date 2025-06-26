import { Injectable } from '@nestjs/common';
import { CreateEvoucherDto } from '../dto/create-evoucher.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Evoucher } from '../schemas/evoucher.schema';
import { Model } from 'mongoose';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';
import { EvoucherCodesService } from './evoucher-codes.service';

@Injectable()
export class EvouchersService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<Evoucher>,
    private readonly evoucherCodesService: EvoucherCodesService,
  ) {}
  async create(createDto: CreateEvoucherDto) {
    const evoucher = await this.evoucherModel.create(createDto);

    await this.evoucherCodesService.generateCodesForEvoucher(
      evoucher._id.toString(),
    );

    return evoucher;
  }

  findAll() {
    return this.evoucherModel.find().lean();
  }

  findOne(id: string) {
    return this.evoucherModel.findById(id).lean();
  }

  async update(id: string, updateDto: UpdateEvoucherDto) {
    const oldEvoucher = await this.evoucherModel.findById(id).lean();
    if (!oldEvoucher) throw new Error('Evoucher not found');

    const updatedEvoucher = await this.evoucherModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!updatedEvoucher) throw new Error('Updated evoucher not found');
    if (updateDto.amount && updateDto.amount > oldEvoucher.amount) {
      const diff = updateDto.amount - oldEvoucher.amount;

      await this.evoucherCodesService.generateCodesForEvoucher(
        updatedEvoucher._id.toString(),
        diff,
      );
    }

    return updatedEvoucher;
  }

  remove(id: string) {
    return this.evoucherModel.findByIdAndDelete(id).lean();
  }
}
