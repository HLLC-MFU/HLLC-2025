import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

import { findOrThrow } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

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

    try {
      return await newEvoucherCode.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'code');
    }
  }



  async findAll(query: Record<string, string>) {
    return await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      populateFields: excluded =>
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
      populateFields: () =>
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
    const voucherCode = await findOrThrow(this.evoucherCodeModel, id, 'Voucher code');
    const evoucher = await findOrThrow(this.evoucherModel, voucherCode.evoucher, 'Evoucher');


    if (!existingCode) {
      throw new BadRequestException('Voucher code not found');
    }

    if (updateEvoucherCodeDto.isUsed === true) {
      if (existingCode.isUsed) {
        throw new BadRequestException('This voucher code has already been used');
      }
    }

    if (existingCode.isUsed && updateEvoucherCodeDto.isUsed === false) {
      throw new BadRequestException('Cannot reuse a used voucher code');
    }

    console.log('NOW:', new Date(Date.now()).toISOString());
    console.log('EXPIRATION:', new Date(evoucher.expiration).toISOString());

    if (Date.now() > new Date(evoucher.expiration).getTime()) {
      throw new BadRequestException('Voucher code has expired');
    }

    return await queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, updateEvoucherCodeDto);
  }


  async remove(id: string) {
    await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
    return {
      message: 'Evoucher code deleted successfully',
      id,
    }
  }

  // async useVoucher(id: string, user: string) {
  //   const voucherCode = await findOrThrow(this.evoucherCodeModel, id, 'Voucher code');
  //   const evoucher = await findOrThrow(this.evoucherModel, voucherCode.evoucher, 'Evoucher');

  //   if (voucherCode.isUsed) {
  //     throw new BadRequestException('Voucher code has already been used');
  //   }

  //   if (Date.now() > new Date(evoucher.expiration).getTime()) {
  //     throw new BadRequestException('Voucher code has expired');
  //   }

  //   if (voucherCode.user && voucherCode.user.toString() !== user) {
  //     throw new BadRequestException('This voucher code is not assigned to you');
  //   }

  //   voucherCode.isUsed = true;
  //   return await voucherCode.save();
  // }


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

    const codesToInsert: { code: string; evoucher: Types.ObjectId; user: Types.ObjectId; isUsed: boolean; metadata: { expiration: Date } }[] = [];
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

    try {
      await this.evoucherCodeModel.insertMany(codesToInsert);
      return codesToInsert.map(c => c.code);
    } catch (error) {
      handleMongoDuplicateError(error, 'code');
    }
  }

  async checkVoucherUsage(user: string, evoucher: string): Promise<boolean> {
    const usedVoucher = await this.evoucherCodeModel.findOne({
      user: user,
      evoucher: evoucher,
      isUsed: true
    });

    return !!usedVoucher;
  }
}
