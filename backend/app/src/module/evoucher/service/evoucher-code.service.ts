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
import { EvoucherType, EvoucherTypeDocument } from '../schema/evoucher-type.schema';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EvoucherType.name) private evoucherTypeModel: Model<EvoucherTypeDocument>
  ) {}

  //================= Generate Code Helper =================
  private async generateNextCode(acronym: string): Promise<string> {
    const latest = await this.evoucherCodeModel
      .findOne({ code: new RegExp(`^${acronym}\\d+$`) })
      .sort({ code: -1 });

    const lastNumber = latest?.code.match(/\d+$/)?.[0] ?? '0';
    const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(6, '0');
    return `${acronym}${nextNumber}`;
  }

  //================= Create Single Code =================
  async create(createEvoucherCodeDto: CreateEvoucherCodeDto) {
    const evoucher = await findOrThrow(this.evoucherModel, createEvoucherCodeDto.evoucher, 'Evoucher not found');
    if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Cannot create code for expired evoucher');
    await findOrThrow(this.userModel, createEvoucherCodeDto.user, 'User not found');
    const prefix = evoucher.acronym;
    const generatedCode = await this.generateNextCode(prefix);

    const newCode = new this.evoucherCodeModel({
      ...createEvoucherCodeDto,
      code: generatedCode,
      isUsed: false,
      evoucher: new Types.ObjectId(createEvoucherCodeDto.evoucher),
      user: new Types.ObjectId(createEvoucherCodeDto.user),
      metadata: { expiration: evoucher.expiration }
    });

    return await newCode.save();
  }

  //================= Bulk Generate =================
  async generateEvoucherCodes(dto: CreateEvoucherCodeDto & { count: number }) {
    const evoucher = await findOrThrow(this.evoucherModel, dto.evoucher, 'Evoucher');
    if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Cannot generate code for expired evoucher');

    const existingCodes = await this.evoucherCodeModel.find({ code: new RegExp(`^${evoucher.acronym}\\d+$`) }).lean();
    const existingNumbers = new Set(existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, ''))));
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
    await this.evoucherCodeModel.insertMany(codesToInsert);
    return codesToInsert.map(c => c.code);
  }

  //================= Claim Logic =================
  async claimEvoucher(userId: string, evoucherId: string) {
    await findOrThrow(this.userModel, userId, 'User not found');
    const evoucher = await this.evoucherModel.findById(evoucherId).populate('type') as any;
    if (!evoucher) throw new BadRequestException('Evoucher not found');
    if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Evoucher expired');
    if (!evoucher.type?.isClaimable) throw new BadRequestException('This type is not claimable');

    const exists = await this.evoucherCodeModel.findOne({ user: userId, evoucher: evoucherId });
    if (exists) throw new BadRequestException('You already have this evoucher');

    // Try to get available code
    let code = await this.evoucherCodeModel.findOneAndUpdate(
      { evoucher: evoucherId, user: null, isUsed: false },
      { user: new Types.ObjectId(userId) },
      { new: true }
    ).populate('evoucher');

    // Generate new if none
    if (!code) {
      const generatedCode = await this.generateNextCode(evoucher.acronym);
      const newCode = new this.evoucherCodeModel({
        code: generatedCode,
        evoucher: new Types.ObjectId(evoucherId),
        user: new Types.ObjectId(userId),
        isUsed: false,
        metadata: { expiration: evoucher.expiration }
      });
      code = await newCode.save();
      await code.populate('evoucher');
    }
    return code;
  }

  //================= Public Available for User =================
  async getPublicAvailableEvouchersForUser(userId?: string) {
    const evouchers = await this.evoucherModel
      .find({})
      .populate('type')
      .populate('sponsors')
      .lean();

    const result = await Promise.all(
      evouchers.map(async (evoucher: any) => {
        const expired = new Date() > new Date(evoucher.expiration);
        let userHas = false;

        if (userId) {
          const code = await this.evoucherCodeModel.exists({ user: userId, evoucher: evoucher._id });
          userHas = !!code;
        }

        let availableCount = 0;
        if (evoucher.type?.isClaimable) {
          availableCount = userHas ? 0 : 1;
        } else {
          availableCount = await this.evoucherCodeModel.countDocuments({
            evoucher: evoucher._id, user: null, isUsed: false
          });
        }

        const canClaim = evoucher.type?.isClaimable && !userHas && !expired;
        return { ...evoucher, isClaimable: evoucher.type?.isClaimable, userHas, availableCount, expired, canClaim };
      })
    );
    return result.filter(e => e.canClaim || (!userId && e.isClaimable && !e.expired && e.availableCount > 0));
  }

  //================= User Codes =================
  async getUserEvoucherCodes(userId: string) {
    const codes = await this.evoucherCodeModel
      .find({ user: userId })
      .populate({ path: 'evoucher', populate: [{ path: 'type' }, { path: 'sponsors' }] })
      .lean();

    return codes.map((code: any) => ({
      ...code,
      expired: code.metadata?.expiration ? (new Date() > new Date(code.metadata.expiration)) : false,
      canUse: !code.isUsed && !(new Date() > new Date(code.metadata?.expiration || code.evoucher?.expiration))
    }));
  }

  //================= Admin Update =================
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

  //================= CRUD for Admin =================
  async findAll(query: Record<string, string>) {
    return await queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query,
      filterSchema: {},
      populateFields: excluded => Promise.resolve(excluded.includes('evoucher') ? [] : [{ path: 'evoucher' }]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<EvoucherCode>(this.evoucherCodeModel, { _id: id }, [{ path: 'evoucher' }]);
  }

  async findOneByQuery(query: Partial<EvoucherCode>) {
    return queryFindOne<EvoucherCode>(this.evoucherCodeModel, query, [{ path: 'evoucher' }, { path: 'user' }]);
  }

  async findAllByQuery(query: Partial<EvoucherCode>) {
    return queryAll<EvoucherCode>({
      model: this.evoucherCodeModel,
      query: query as Record<string, string>,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'evoucher' }, { path: 'user' }]),
    });
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
