import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
import { generateBulkVoucherCodes, claimVoucherCode, validateUserDuplicateClaim, generateNextVoucherCode, validateEvoucherExpired, validateEvoucherTypeClaimable } from '../utils/evoucher-code.util';
import { BulkGenerateInput, PopulatedEvoucherCode } from '../types/evoucher-code.type';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateEvoucherCodeDto) {
    const evoucher = await findOrThrow(this.evoucherModel, dto.evoucher, 'Evoucher not found');
    if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Cannot create code for expired evoucher');
    await findOrThrow(this.userModel, dto.user, 'User not found');

    const code = await generateNextVoucherCode(this.evoucherCodeModel, evoucher.acronym);

    const newCode = new this.evoucherCodeModel({
      ...dto,
      code,
      isUsed: false,
      evoucher: new Types.ObjectId(dto.evoucher),
      user: new Types.ObjectId(dto.user),
      metadata: { expiration: evoucher.expiration }
    });

    return await newCode.save();
  }

  async generateEvoucherCodes(dto: CreateEvoucherCodeDto & { count: number }) {
    const evoucher = await findOrThrow(this.evoucherModel, dto.evoucher, 'Evoucher not found');
    if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Cannot generate code for expired evoucher');

    const existingCodes = await this.evoucherCodeModel.find({ code: new RegExp(`^${evoucher.acronym}\\d+$`) }).lean();
    const codesToInsert = generateBulkVoucherCodes(dto as BulkGenerateInput, evoucher, existingCodes);

    await this.evoucherCodeModel.insertMany(codesToInsert);
    return codesToInsert.map(c => c.code);
  }

  async claimEvoucher(userId: string, evoucherId: string) {
    await findOrThrow(this.userModel, userId, 'User not found');
    const evoucher = await validateEvoucherExpired(evoucherId, this.evoucherModel);
    validateEvoucherTypeClaimable(evoucher.type);
    await validateUserDuplicateClaim(userId, evoucherId, this.evoucherCodeModel);
    return await claimVoucherCode(userId, evoucher, this.evoucherCodeModel);
  }


  async getUserEvoucherCodes(userId: string) {
    const codes = await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query: { user: userId },
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { 
          path: 'evoucher',
          populate: [
            { path: 'type' },
            { path: 'sponsors' }
          ]
        }
      ]),
    });
    const processedData = codes.data.map((code: EvoucherCode) => {
      const evoucherData = code.evoucher as unknown as Evoucher;
      const expiration = code.metadata?.expiration || evoucherData.expiration;
      const expired = expiration ? new Date() > new Date(expiration) : false;
      const canUse = !code.isUsed && !expired;

      return {
        ...code,
        canUse
      };
    });

    return {
      ...codes,
      data: processedData
    };
  }
  
  async update(id: string, updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    const voucherCode = await findOrThrow(this.evoucherCodeModel, id, 'Voucher code');
    const evoucher = await findOrThrow(this.evoucherModel, voucherCode.evoucher, 'Evoucher');

    if (updateEvoucherCodeDto.isUsed === true && voucherCode.isUsed) {
      throw new BadRequestException('Already used');
    }
    if (voucherCode.isUsed && updateEvoucherCodeDto.isUsed === false) {
      throw new BadRequestException('Cannot reuse');
    }
    if (new Date() > new Date(evoucher.expiration)) {
      throw new BadRequestException('Voucher code expired');
    }
    return await queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, updateEvoucherCodeDto);
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query: query,
      filterSchema: {},
      populateFields: excluded => Promise.resolve(excluded.includes('evoucher') ? [] : [{ path: 'evoucher' }]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<EvoucherCode>(this.evoucherCodeModel, { _id: id }, [{ path: 'evoucher' }]);
  }

  async remove(id: string) {
    await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
    return { message: 'Evoucher code deleted successfully', id };
  }

  async checkVoucherUsage(user: string, evoucher: string): Promise<boolean> {
    const used = await this.evoucherCodeModel.findOne({ user, evoucher, isUsed: true });
    return !!used;
  }
}
