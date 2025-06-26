import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Evoucher, EvoucherDocument } from '../schemas/evoucher.schema';
import {
  EvoucherCode,
  EvoucherCodeDocument,
} from '../schemas/evoucher-code.schema';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { UpdateEvoucherDto } from '../dto/update-evoucher.dto';

@Injectable()
export class EvoucherCodesService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(EvoucherCode.name)
    private codeModel: Model<EvoucherCodeDocument>,
  ) {}

  async findAll() {
    return this.evoucherModel.find().lean();
  }

  async findOne(id: string) {
    return this.evoucherModel.findById(id).lean();
  }

  async update(id: string, updateDto: UpdateEvoucherDto) {
    return this.evoucherModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );
  }

  async remove(id: string) {
    return this.evoucherModel.findByIdAndDelete(id).lean();
  }

  // ฟังก์ชันหลักสำหรับ generate codes
  private generateCode(acronym: string): string {
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
    return `${acronym}-${randomHex}`;
  }

  async generateCodesForEvoucher(evoucherId: string, amountOverride?: number) {
    const evoucher = await this.evoucherModel.findById(evoucherId).lean();
    if (!evoucher) throw new Error('Evoucher not found');

    const amount = amountOverride ?? evoucher.amount;
    const acronym = evoucher.acronym;

    const codesToInsert = new Set<string>();

    while (codesToInsert.size < amount) {
      const newCode = this.generateCode(acronym);
      if (!codesToInsert.has(newCode)) {
        const exists = await this.codeModel.exists({ code: newCode });
        if (!exists) codesToInsert.add(newCode);
      }
    }

    const bulkData = Array.from(codesToInsert).map((code) => ({
      code,
      isUsed: false,
      usedAt: null,
      user: null,
    }));

    const inserted = await this.codeModel.insertMany(bulkData);
    return {
      success: true,
      insertedCount: inserted.length,
      evoucher: evoucherId,
    };
  }
}
