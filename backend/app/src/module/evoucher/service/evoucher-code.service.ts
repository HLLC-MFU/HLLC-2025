import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { Evoucher, EvoucherDocument, EvoucherStatus } from '../schema/evoucher.schema';
import { 
  generateEvoucherCode, 
  claimVoucherCode, 
  validateUserDuplicateClaim, 
  validateEvoucherExpired, 
  validateEvoucherTypeClaimable,
  useEvoucherCode as useEvoucherCodeUtil
} from '../utils/evoucher.util';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateEvoucherCodeDto) {
    const evoucher = await validateEvoucherExpired(dto.evoucher, this.evoucherModel);
    await findOrThrow(this.userModel, dto.user, 'User not found');

    const code = await generateEvoucherCode(dto, evoucher, []);

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
    const evoucher = await validateEvoucherExpired(dto.evoucher, this.evoucherModel);

    const existingCodes = await this.evoucherCodeModel.find({ code: new RegExp(`^${evoucher.acronym}\\d+$`) }).lean();
    const codesToInsert = generateEvoucherCode(dto, evoucher, existingCodes);

    await this.evoucherCodeModel.insertMany(codesToInsert);
    return codesToInsert;
  }

  async claimEvoucher(userId: string, evoucherId: string) {
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
            { path: 'sponsors' }
          ]
        }
      ]),
    });

    const processedData = codes.data.map((code: EvoucherCode) => {
      const evoucherData = code.evoucher as unknown as Evoucher;
      const expiration = code.metadata?.expiration || evoucherData.expiration;
      const isExpire = expiration ? new Date() > new Date(expiration) : false;
      const canUse = !code.isUsed && !isExpire;

      return {
        ...code,
        canUse,
        isExpire
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

    return await queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, updateEvoucherCodeDto);
  }

  async findAll(query: Record<string, string>) {
    return await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { 
          path: 'evoucher',
          populate: [
            { path: 'sponsors' }
          ]
        },
        { path: 'user' }
      ]),
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

  async useEvoucherCode(userId: Types.ObjectId, codeId: string) {
    const evoucherCode = await useEvoucherCodeUtil(userId, codeId, this.evoucherCodeModel);
    return {
      message: 'Evoucher code used successfully',
      code: evoucherCode
    };
  }
}
