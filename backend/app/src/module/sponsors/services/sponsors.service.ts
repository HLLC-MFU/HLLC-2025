import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Sponsors, SponsorsDocument } from '../schemas/sponsors.schema';
import { CreateSponsorTypeDto } from '../dto/create-sponsor-type.dto';
import { UpdateSponsorTypeDto } from '../dto/update-sponsor-type.dto';
import {
  SponsorsType,
  SponsorsTypeDocument,
} from '../schemas/sponsors-type.schema';
import { CreateSponsorDto } from '../dto/create-sponsor.dto';
import { UpdateSponsorDto } from '../dto/update-sponsor.dto';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(Sponsors.name) private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(SponsorsType.name)
    private sponsorTypeModel: Model<SponsorsTypeDocument>,
  ) {}

  // ───── SponsorsType ─────

  async createType(dto: CreateSponsorTypeDto): Promise<SponsorsType> {
    const created = new this.sponsorTypeModel(dto);
    return (await created.save()).toObject();
  }

  async findAllTypes(): Promise<SponsorsType[]> {
    return this.sponsorTypeModel.find().sort({ priority: -1 }).lean(); // เรียงจากสำคัญมากไปน้อย
  }

  async updateType(
    id: string,
    dto: UpdateSponsorTypeDto,
  ): Promise<SponsorsType> {
    const updated = await this.sponsorTypeModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Sponsor Type not found');
    return updated;
  }

  async deleteType(id: string): Promise<void> {
    await this.sponsorTypeModel.findByIdAndDelete(id);
  }

  // ───── Sponsors ─────

  async createSponsor(dto: CreateSponsorDto): Promise<Sponsors> {
    const sponsor = new this.sponsorsModel(dto);
    return sponsor.save();
  }

  async findAllSponsors(): Promise<Sponsors[]> {
    return this.sponsorsModel
      .find()
      .populate('type')
      .lean();
  }

  async findSponsorsByType(typeId: string): Promise<Sponsors[]> {
    return this.sponsorsModel
      .find({ type: new Types.ObjectId(typeId) })
      .populate('type')
      .lean();
  }

  async updateSponsor(id: string, dto: UpdateSponsorDto): Promise<Sponsors> {
    const updated = await this.sponsorsModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Sponsor not found');
    return updated;
  }

  async deleteSponsor(id: string): Promise<void> {
    await this.sponsorsModel.findByIdAndDelete(id);
  }
}
