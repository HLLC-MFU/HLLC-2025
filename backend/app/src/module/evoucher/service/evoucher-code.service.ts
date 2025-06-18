import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { 
  generateEvoucherCode, 
  claimVoucherCode, 
  validateUserDuplicateClaim, 
  validateEvoucherExpired, 
  validateEvoucherTypeClaimable,
  useEvoucherCode as useEvoucherCodeUtil,
  validateEvoucherState,
  validateMaxClaims
} from '../utils/evoucher.util';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';

@Injectable()
export class EvoucherCodeService {
  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private async getExistingCodes(acronym: string) {
    return await this.evoucherCodeModel
      .find({ code: new RegExp(`^${acronym}\\d+$`) })
      .lean();
  }

  async create(dto: CreateEvoucherCodeDto) {
    const [evoucher, user] = await Promise.all([
      validateEvoucherExpired(dto.evoucher, this.evoucherModel),
      findOrThrow(this.userModel, dto.user, 'User not found'),
    ]);

    // Validate evoucher state and max claims
    validateEvoucherState(evoucher);
    await validateMaxClaims(evoucher, this.evoucherCodeModel);
    await validateUserDuplicateClaim(dto.user, dto.evoucher, this.evoucherCodeModel);

    const trySave = async () => {
      const code = generateEvoucherCode(dto, evoucher);
      const doc = new this.evoucherCodeModel({
        ...dto,
        code,
        isUsed: false,
        evoucher: new Types.ObjectId(dto.evoucher),
        user: new Types.ObjectId(dto.user),
        metadata: { expiration: evoucher.expiration }
      });
      return await doc.save();
    };

    try {
      return await trySave();
    } catch (error) {
      if (error.code === 11000) {
        try {
          return await trySave(); // retry once
        } catch {
          throw new BadRequestException('Failed to generate unique code after retry');
        }
      }
      throw error;
    }
  }

  async generateEvoucherCodes(dto: CreateEvoucherCodeDto & { count: number }) {
    const evoucher = await validateEvoucherExpired(dto.evoucher, this.evoucherModel);
    
    // Validate evoucher state and max claims
    validateEvoucherState(evoucher);
    await validateMaxClaims(evoucher, this.evoucherCodeModel);

    const generated = generateEvoucherCode(dto, evoucher);
    await this.evoucherCodeModel.insertMany(generated);
    return generated;
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
        { path: 'evoucher', populate: [{ path: 'sponsors' }] }
      ])
    });

    const processed = codes.data.map(code => {
      const evoucher = code.evoucher as unknown as Evoucher;
      const isExpire = evoucher.expiration && new Date() > new Date(evoucher.expiration);
      return { ...code, canUse: !code.isUsed && !isExpire, isExpire };
    });

    return { ...codes, data: processed };
  }

  update(id: string, dto: UpdateEvoucherCodeDto) {
    return queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, dto);
  }

  findAll(query: Record<string, string>) {
    return queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { path: 'evoucher', populate: [{ path: 'sponsors' }] },
        { path: 'user' }
      ]),
    });
  }

  findOne(id: string) {
    return queryFindOne<EvoucherCode>(this.evoucherCodeModel, { _id: id }, [{ path: 'evoucher' }]);
  }

  async remove(id: string) {
    await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
    return { message: 'Evoucher code deleted successfully', id };
  }

  async checkVoucherUsage(user: string, evoucher: string) {
    return !!await this.evoucherCodeModel.findOne({ user, evoucher, isUsed: true });
  }

  async useEvoucherCode(userId: Types.ObjectId, codeId: string) {
    const evoucherCode = await useEvoucherCodeUtil(userId, codeId, this.evoucherCodeModel);
    return { message: 'Evoucher code used successfully', code: evoucherCode };
  }
}
