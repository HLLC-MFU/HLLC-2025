import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { EvoucherDocument, EvoucherType, EvoucherStatus } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';

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
  dto: CreateEvoucherCodeDto & { count: number },
  evoucher: EvoucherDocument,
  existingCodes: EvoucherCodeDocument[]
): CreateEvoucherCodeDto[] {
  const existingNumbers = new Set(existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, ''))));
  const codesToInsert: CreateEvoucherCodeDto[] = [];
  let current = Math.max(...Array.from(existingNumbers), 0) + 1;

  while (codesToInsert.length < dto.count) {
    const code = `${evoucher.acronym}${String(current).padStart(6, '0')}`;
    if (!existingNumbers.has(current)) {
      codesToInsert.push({
        evoucher: evoucher._id.toString(),
        user: dto.user,
        isUsed: false,
        metadata: { expiration: evoucher.expiration.toISOString() }
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

  if (evoucher.maxClaims && totalClaims >= evoucher.maxClaims) {
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

export const validatePublicAvailableVoucher = async (
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string,
) => {
  const evoucherId = evoucher._id;
  const expired = evoucher.expiration && new Date(evoucher.expiration) < new Date();

  const [userHas, currentClaims] = await Promise.all([
    userId
      ? evoucherCodeModel.exists({
          evoucher: evoucherId,
          user: userId,
          isUsed: false,
        })
      : false,
    evoucherCodeModel.countDocuments({
      evoucher: evoucherId,
      user: { $ne: null },
      isUsed: false,
    }),
  ]);

  const reachMaximumClaim = evoucher.maxClaims !== undefined && currentClaims >= evoucher.maxClaims;
  const canClaim = !userHas && !expired && evoucher.type === 'GLOBAL' && !reachMaximumClaim && evoucher.status === EvoucherStatus.ACTIVE;

  // Create a new object without maxClaims
  const { maxClaims, ...evoucherWithoutMaxClaims } = evoucher.toJSON ? evoucher.toJSON() : evoucher;

  return {
    ...evoucherWithoutMaxClaims,
    claims: {
      userHas: !!userHas,
      reachMaximumClaim,
      canClaim
    }
  };
};

