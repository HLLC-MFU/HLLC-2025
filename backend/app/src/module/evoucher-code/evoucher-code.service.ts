import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEvoucherCodeDto } from './dto/create-evoucher-code.dto';
import { UpdateEvoucherCodeDto } from './dto/update-evoucher-code.dto';
import { EvoucherCodeDocument } from './schema/evoucher-code.schema';
import { EvoucherCode } from './schema/evoucher-code.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { validateMetadataSchema, validateObjectIdFields } from 'src/pkg/helper/validateMetadataSchema';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class EvoucherCodeService {

  constructor(
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>
  ) {}

  async create(createEvoucherCodeDto: CreateEvoucherCodeDto) {
    // Validate metadata format: [userId (optional), evoucherId]
    validateMetadataSchema(createEvoucherCodeDto.metadata, {
      user: { type: 'string', required: false },
      evoucher: { type: 'string', required: true },
    });
    validateObjectIdFields(createEvoucherCodeDto.metadata, ['evoucher']);
    
    if (createEvoucherCodeDto.metadata.user) {
      validateObjectIdFields(createEvoucherCodeDto.metadata, ['user']);
    }
  
    const newEvoucherCode = new this.evoucherCodeModel({
      ...createEvoucherCodeDto,
      isUsed: false, // Always create as unused
      metadata: createEvoucherCodeDto.metadata,
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

  async update(id: string, updateEvoucherCodeDto: UpdateEvoucherCodeDto) {
    const existingCode = await this.evoucherCodeModel.findById(id);
    if (!existingCode) {
      throw new BadRequestException('Voucher code not found');
    }

    // If trying to mark as unused when it was used, prevent it
    if (existingCode.isUsed && updateEvoucherCodeDto.isUsed === false) {
      throw new BadRequestException('Cannot reuse a used voucher code');
    }

    return await queryUpdateOne<EvoucherCode>(this.evoucherCodeModel, id, updateEvoucherCodeDto);
  }

  async remove(id: string) {
    return await queryDeleteOne<EvoucherCode>(this.evoucherCodeModel, id);
  }

  async useVoucher(id: string, userId: string) {
    const voucherCode = await this.evoucherCodeModel.findById(id);
    if (!voucherCode) {
      throw new BadRequestException('Voucher code not found');
    }

    if (voucherCode.isUsed) {
      throw new BadRequestException('Voucher code has already been used');
    }

    // Check if voucher is restricted to specific user
    if (voucherCode.metadata.user && voucherCode.metadata.user !== userId) {
      throw new BadRequestException('This voucher code is not assigned to you');
    }

    // Mark voucher as used
    voucherCode.isUsed = true;
    return await voucherCode.save();
  }

  async checkVoucherUsage(userId: string, evoucherId: string): Promise<boolean> {
    const usedVoucher = await this.evoucherCodeModel.findOne({
      'metadata.user': userId,
      'metadata.evoucher': evoucherId,
      isUsed: true
    });
    
    return !!usedVoucher;
  }
}
