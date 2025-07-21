import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvoucherDto } from '../dto/create-evoucher.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Evoucher } from '../schemas/evoucher.schema';
import { Model, Types } from 'mongoose';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';
import { EvoucherCodesService } from './evoucher-codes.service';
import { Sponsors } from 'src/module/sponsors/schemas/sponsors.schema';

@Injectable()
export class EvouchersService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<Evoucher>,
    private readonly evoucherCodesService: EvoucherCodesService,

    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<Sponsors>,
  ) {}
  async validateSponsorExists(sponsorId: Types.ObjectId | string) {
    const exists = await this.sponsorsModel.exists({ _id: sponsorId });
    if (!exists) {
      throw new NotFoundException('Sponsor not found');
    }
  }

  async create(createDto: CreateEvoucherDto) {
    if (createDto.sponsor) {
      await this.validateSponsorExists(createDto.sponsor);
    }
    const evoucher = await this.evoucherModel.create(createDto);

    await this.evoucherCodesService.generateCodesForEvoucher(
      evoucher._id.toString(),
    );
    return evoucher;
  }

  findAll(sponsorId?: string) {
    if (sponsorId) {
      return this.evoucherModel.find({ sponsor: sponsorId }).lean();
    }
    return this.evoucherModel.find().populate('sponsor').lean();
  }

  findOne(id: string) {
    return this.evoucherModel.findById(id).lean();
  }

  async update(id: string, updateDto: UpdateEvoucherDto) {
    const originEvoucher = await this.evoucherModel.findById(id).lean();
    if (!originEvoucher) throw new NotFoundException('Evoucher not found');

    if (updateDto.sponsor) {
      await this.validateSponsorExists(updateDto.sponsor);
    }

    if (updateDto.photo) {
      updateDto.photo = {
        ...originEvoucher.photo,
        ...updateDto.photo,
      }
    }

    const updatedEvoucher = await this.evoucherModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!updatedEvoucher)
      throw new NotFoundException('Updated evoucher not found');

    if (updateDto.amount && updateDto.amount > originEvoucher.amount) {
      const diff = updateDto.amount - originEvoucher.amount;

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
