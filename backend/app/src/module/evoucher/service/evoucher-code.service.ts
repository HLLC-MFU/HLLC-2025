import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EvoucherCode, EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import { 
  validateEvoucher,
  validateClaimEligibility,
  createEvoucherCode,
  useEvoucherCode as useEvoucherCodeUtil,
  validatePublicAvailableVoucher
} from '../utils/evoucher.util';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class EvoucherCodeService {
  constructor(
    @InjectModel(EvoucherCode.name)
    private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
  ) {}

  async create(dto: CreateEvoucherCodeDto) {
    const evoucher = await validateEvoucher(dto.evoucher, this.evoucherModel);
    await validateClaimEligibility(dto.user, evoucher, this.evoucherCodeModel);
    return await createEvoucherCode(dto.user, evoucher, this.evoucherCodeModel);
  }

  async claimEvoucher(userId: string, evoucherId: string) {
    const evoucher = await validateEvoucher(evoucherId, this.evoucherModel);
    await validateClaimEligibility(userId, evoucher, this.evoucherCodeModel);
    return await createEvoucherCode(userId, evoucher, this.evoucherCodeModel);
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