import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EvoucherCode,
  EvoucherCodeDocument,
} from '../schema/evoucher-code.schema';
import { Evoucher, EvoucherDocument } from '../schema/evoucher.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from '../dto/evoucher-codes/update-evoucher-code.dto';
import {
  validateEvoucher,
  validateClaimEligibility,
  createEvoucherCode,
  useEvoucherCode,
  PopulatedEvoucherCode,
} from '../utils/evoucher.util';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';


@Injectable()
export class EvoucherCodeService {
  constructor(
    @InjectModel(EvoucherCode.name)
    private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
  ) {}

  async create(dto: CreateEvoucherCodeDto) {
    const evoucher = await validateEvoucher(dto.evoucher, this.evoucherModel);
    await validateClaimEligibility(dto.user, evoucher, this.evoucherCodeModel);
    return createEvoucherCode(dto.user, evoucher, this.evoucherCodeModel);
  }

  async claimEvoucher(userId: string, evoucherId: string) {
    const evoucher = await validateEvoucher(evoucherId, this.evoucherModel);
    await validateClaimEligibility(userId, evoucher, this.evoucherCodeModel);
    return createEvoucherCode(userId, evoucher, this.evoucherCodeModel);
  }

  async getUserEvoucherCodes(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    const codes = await this.evoucherCodeModel
      .find({ user: userObjectId })
      .populate({
        path: 'evoucher',
        populate: { path: 'sponsors' }
      })
      .lean<PopulatedEvoucherCode[]>();

    const processed = codes.map((code) => {
      const { evoucher } = code;
      const isExpire = evoucher.expiration ? new Date() > evoucher.expiration : false;

      return {
        ...code,
        canUse: !code.isUsed && !isExpire,
        isExpire,
      };
    });

    const total = processed.length;
    return {
      data: processed,
      meta: {
        total,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(total / 20),
        lastUpdatedAt: new Date(),
      },
    };
  }

  update(id: string, dto: UpdateEvoucherCodeDto) {
    return queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, dto);
  }

  findAll(query: Record<string, string>) {
    return queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          { path: 'evoucher', populate: [{ path: 'sponsors' }] },
          { path: 'user' },
        ]),
    });
  }

  findOne(id: string) {
    return queryFindOne<EvoucherCode>(this.evoucherCodeModel, { _id: id }, [
      { path: 'evoucher' },
    ]);
  }

  async remove(id: string) {
    await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
    return { message: 'Evoucher code deleted successfully', id };
  }

  async checkVoucherUsage(user: string, evoucher: string) {
    const userObjectId = new Types.ObjectId(user);
    const evoucherObjectId = new Types.ObjectId(evoucher);
    
    const found = await this.evoucherCodeModel.findOne({
      user: userObjectId,
      evoucher: evoucherObjectId,
      isUsed: true,
    });

    return Boolean(found);
  }

  async useEvoucherCode(userId: Types.ObjectId, codeId: string) {
    const evoucherCode = await useEvoucherCode(
      userId,
      codeId,
      this.evoucherCodeModel,
    );
    return { message: 'Evoucher code used successfully', code: evoucherCode };
  }
}
