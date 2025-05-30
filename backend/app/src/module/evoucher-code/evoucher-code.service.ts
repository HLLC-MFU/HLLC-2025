import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEvoucherCodeDto } from './dto/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from './dto/update-evoucher-code.dto';
import { EvoucherCodeDocument } from './schema/evoucher-code.schema';
import { EvoucherCode } from './schema/evoucher-code.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Evoucher, EvoucherDocument } from '../evoucher/schema/evoucher.schema';
import { findOrThrow } from 'src/pkg/validator/model.validator';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(createEvoucherCodeDto: CreateEvoucherCodeDto) {
    const evoucher = await findOrThrow(
      this.evoucherModel,
      createEvoucherCodeDto.evoucher,
      'Evoucher not found'
    );

    // Check if evoucher is expired
    if (new Date() > new Date(evoucher.expiration)) {
      throw new BadRequestException('Cannot create code for expired evoucher');
    }
  
    await findOrThrow(
      this.userModel,
      createEvoucherCodeDto.user,
      'User not found'
    );
  
    const prefix = evoucher.acronym;
  
    const generatedCode = await this.generateNextCode(prefix);
  
    const newEvoucherCode = new this.evoucherCodeModel({
      ...createEvoucherCodeDto,
      code: generatedCode,
      isUsed: false,
      evoucher: new Types.ObjectId(createEvoucherCodeDto.evoucher),
      user: new Types.ObjectId(createEvoucherCodeDto.user),
      metadata: {
        expiration: evoucher.expiration
      }
    });
  
    return await newEvoucherCode.save();
  }
  
  

  async findAll(query: Record<string, any>) {
    return await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      buildPopulateFields: excluded =>
        Promise.resolve(excluded.includes('evoucher') ? [] : [{ path: 'evoucher' }]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<EvoucherCode>(this.evoucherCodeModel, { _id: id }, [{ path: 'evoucher' }]);
  }

async findOneByQuery(query: Partial<EvoucherCode>) {
  return queryFindOne<EvoucherCode>(
    this.evoucherCodeModel,
    query,
    [{ path: 'evoucher' }, { path: 'user' }]
  );
}

async findAllByQuery(query: Partial<EvoucherCode>) {
  return queryAll<EvoucherCode>({
    model: this.evoucherCodeModel,
    query: query as Record<string, string>,
    filterSchema: {},
    buildPopulateFields: () =>
      Promise.resolve([{ path: 'evoucher' }, { path: 'user' }]),
  });
}

async getExistsEvoucherCodes(userId: string): Promise<{ evoucher: Evoucher; exists: boolean; available: boolean }[]> {
  const evouchers = await this.evoucherModel
    .find({})
    .lean();

  const codes = await Promise.all(
    evouchers.map(async (evoucher) => {
      const exists = await this.evoucherCodeModel.exists({
        user: userId,
        evoucher: evoucher._id,
      });

      const available = await this.evoucherCodeModel.exists({
        user: null,
        evoucher: evoucher._id,
      });

      return {
        evoucher,
        exists: !!exists,
        available: !!available,
      };
    })
  );

  return codes.filter((c) => !c.exists && c.available);
}



  async update(id: string, updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    const existingCode = await this.evoucherCodeModel.findById(id);
    if (!existingCode) {
      throw new BadRequestException('Voucher code not found');
    }

    if (existingCode.isUsed && updateEvoucherCodeDto.isUsed === false) {
      throw new BadRequestException('Cannot reuse a used voucher code');
    }

    return await queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, updateEvoucherCodeDto);
  }

  async remove(id: string) {
    return await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
  }

  async useVoucher(id: string, user: string) {
    const voucherCode = await findOrThrow(this.evoucherCodeModel, id, 'Voucher code');
    const evoucher = await findOrThrow(this.evoucherModel, voucherCode.evoucher, 'Evoucher');
  
    if (voucherCode.isUsed) {
      throw new BadRequestException('Voucher code has already been used');
    }
  
    if (new Date() > new Date(evoucher.expiration)) {
      throw new BadRequestException('Voucher code has expired');
    }
  
    if (voucherCode.user && voucherCode.user.toString() !== user) {
      throw new BadRequestException('This voucher code is not assigned to you');
    }
  
    voucherCode.isUsed = true;
    return await voucherCode.save();
  }
  

  private async generateNextCode(acronym: string): Promise<string> {
    const latest = await this.evoucherCodeModel
      .findOne({ code: new RegExp(`^${acronym}\\d+$`) })
      .sort({ code: -1 });
  
    const lastNumber = latest?.code.match(/\d+$/)?.[0] ?? '0';
    const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(6, '0');
    return `${acronym}${nextNumber}`;
  }

  async generateEvoucherCodes(dto: CreateEvoucherCodeDto & { count: number }) {
    const evoucher = await findOrThrow(this.evoucherModel, dto.evoucher, 'Evoucher');
  
    if (new Date() > new Date(evoucher.expiration)) {
      throw new BadRequestException('Cannot generate code for expired evoucher');
    }
  
    const existingCodes = await this.evoucherCodeModel
      .find({ code: new RegExp(`^${evoucher.acronym}\\d+$`) })
      .lean();
  
    const existingNumbers = new Set(
      existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, '')))
    );
  
    const codesToInsert: any[] = [];
    let current = Math.max(...Array.from(existingNumbers), 0) + 1;
  
    while (codesToInsert.length < dto.count) {
      const code = `${evoucher.acronym}${String(current).padStart(6, '0')}`;
      if (!existingNumbers.has(current)) {
        codesToInsert.push({
          code,
          evoucher: new Types.ObjectId(dto.evoucher),
          user: new Types.ObjectId(dto.user),
          isUsed: false,
          metadata: { expiration: evoucher.expiration }
        });
      }
      current++;
    }
  
    await this.evoucherCodeModel.insertMany(codesToInsert);
    return codesToInsert.map(c => c.code);
  }
  
  

  // async checkVoucherUsage(userId: string, evoucherId: string): Promise<boolean> {
  //   const usedVoucher = await this.evoucherCodeModel.findOne({
  //     'metadata.user': userId,
  //     'metadata.evoucher': evoucherId,
  //     isUsed: true
  //   });
    
  //   return !!usedVoucher;
  // }
}
