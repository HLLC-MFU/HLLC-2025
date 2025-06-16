import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { EvoucherDocument, EvoucherType } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import {
  BulkGenerateInput,
  VoucherCodeInsert,
  VoucherUpdateParams
} from '../types/evoucher.type';

export async function validateEvoucherExpired(evoucherId: string, evoucherModel: Model<EvoucherDocument>) {
  const evoucher = await evoucherModel.findById(evoucherId);
  if (!evoucher) throw new BadRequestException('Evoucher not found');
  if (new Date() > new Date(evoucher.expiration)) {
    throw new BadRequestException('Evoucher expired');
  }
  return evoucher;
} 

export function validateEvoucherTypeClaimable(type: EvoucherType) {
  if (type !== EvoucherType.GLOBAL) {
    throw new BadRequestException('This type is not claimable');
  }
}

export async function validateUserDuplicateClaim(
    userId: string,
    evoucherId: string,
    evoucherCodeModel: Model<EvoucherCodeDocument>
  ): Promise<void> {
    const exists = await evoucherCodeModel.findOne({
      user: new Types.ObjectId(userId),
      evoucher: new Types.ObjectId(evoucherId),
    });
    if (exists) throw new BadRequestException('You already have this evoucher');
  }
  
export function validateUpdateVoucher(params: VoucherUpdateParams) {
  const { currentVoucherIsUsed, updateIsUsed, evoucherExpiration } = params;

  if (updateIsUsed === true && currentVoucherIsUsed) {
    throw new BadRequestException('Already used');
  }
  if (currentVoucherIsUsed && updateIsUsed === false) {
    throw new BadRequestException('Cannot reuse');
  }
  if (new Date() > new Date(evoucherExpiration)) {
    throw new BadRequestException('Voucher code expired');
  }
}

export async function generateNextVoucherCode(
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  acronym: string
): Promise<string> {
  const latest = await evoucherCodeModel.findOne({ code: new RegExp(`^${acronym}\\d+$`) }).sort({ code: -1 });
  const lastNumber = latest?.code.match(/\d+$/)?.[0] ?? '0';
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(6, '0');
  return `${acronym}${nextNumber}`;
}

export function generateBulkVoucherCodes(
  dto: BulkGenerateInput,
  evoucher: EvoucherDocument,
  existingCodes: EvoucherCodeDocument[]
): VoucherCodeInsert[] {
  const existingNumbers = new Set(existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, ''))));
  const codesToInsert: VoucherCodeInsert[] = [];
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
  return codesToInsert;
}

export async function claimVoucherCode(
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) {
  // First check if we've reached max claims
  const totalClaims = await evoucherCodeModel.countDocuments({
    evoucher: evoucher._id,
    user: { $ne: null },
    isUsed: false
  });

  if (evoucher.maxClaims !== null && totalClaims >= evoucher.maxClaims) {
    throw new BadRequestException('Maximum claims reached for this voucher');
  }

  let code = await evoucherCodeModel.findOneAndUpdate(
    { evoucher: evoucher._id, user: null, isUsed: false },
    { user: new Types.ObjectId(userId) },
    { new: true }
  );

  if (!code) {
    const generatedCode = await generateNextVoucherCode(evoucherCodeModel, evoucher.acronym);
    code = await new evoucherCodeModel({
      code: generatedCode,
      evoucher: evoucher._id,
      user: new Types.ObjectId(userId),
      isUsed: false,
      metadata: { expiration: evoucher.expiration }
    }).save();
  }

  return code;
}

export async function validatePublicAvailableVoucher(
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string
) {
  const expired = new Date() > new Date(evoucher.expiration);
  const userObjectId = userId ? new Types.ObjectId(userId) : null;
  const evoucherId = new Types.ObjectId(evoucher._id);

  const userHas = userObjectId 
    ? await evoucherCodeModel.exists({ 
        user: userObjectId, 
        evoucher: evoucherId 
      }).then(res => !!res)
    : false;

  const totalClaims = await evoucherCodeModel.countDocuments({
    evoucher: evoucherId,
    user: { $ne: null },
    isUsed: false
  });

  const reachedMaxClaims = evoucher.maxClaims !== null && totalClaims >= evoucher.maxClaims;

  return {
    ...evoucher,
    userHas,
    totalClaims,  
    maxClaims: evoucher.maxClaims,
    canClaim: !userHas && !expired && evoucher.type === 'GLOBAL' && !reachedMaxClaims
  };
}

