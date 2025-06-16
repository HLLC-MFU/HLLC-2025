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
  
export function generateEvoucherCode(
  dto: CreateEvoucherCodeDto & { count?: number },
  evoucher: EvoucherDocument,
  existingCodes: EvoucherCodeDocument[] = []
): string | CreateEvoucherCodeDto[] {
  const count = dto.count ?? 1;
  const existingNumbers = new Set(
    existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, '')))
  );
  let current = Math.max(...Array.from(existingNumbers), 0) + 1;

  if (count === 1) {
    return `${evoucher.acronym}${String(current).padStart(6, '0')}`;
  }

  return Array.from({ length: count }, () => {
    const codeNumber = String(current++).padStart(6, '0');
    return {
      code: `${evoucher.acronym}${codeNumber}`,
      evoucher: evoucher._id.toString(),
      user: dto.user,
      isUsed: false,
      metadata: { expiration: evoucher.expiration.toISOString() }
    };
  });
}
  

export async function claimVoucherCode(
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) {
  const [currentClaims, availableCode] = await Promise.all([
    evoucher.maxClaims ? evoucherCodeModel.countDocuments({
      evoucher: evoucher._id,
      user: { $ne: null },
      isUsed: false
    }) : 0,
    evoucherCodeModel.findOneAndUpdate(
      { evoucher: evoucher._id, user: null, isUsed: false },
      { user: new Types.ObjectId(userId) },
      { new: true }
    )
  ]);

  if (evoucher.maxClaims && currentClaims >= evoucher.maxClaims) {
    throw new BadRequestException('Maximum claims reached for this voucher');
  }

  if (availableCode) return availableCode;

  const newCode = await evoucherCodeModel.create({
    code: generateEvoucherCode({
      evoucher: evoucher._id.toString(),
      user: userId,
      metadata: { expiration: evoucher.expiration.toISOString() }
    }, evoucher) as string,
    evoucher: evoucher._id,
    user: new Types.ObjectId(userId),
    isUsed: false,
    metadata: { expiration: evoucher.expiration }
  });

  return newCode;
}

export const validatePublicAvailableVoucher = async (
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string,
) => {
  const evoucherId = evoucher._id;
  const expired = evoucher.expiration && new Date(evoucher.expiration) < new Date();

  if (expired || evoucher.type !== 'GLOBAL' || evoucher.status !== EvoucherStatus.ACTIVE) {
    return {
      ...evoucher.toJSON(),
      claims: {
        userHas: false,
        reachMaximumClaim: false,
        canClaim: false
      }
    };
  }

  const [userHas, currentClaims] = await Promise.all([
    userId ? evoucherCodeModel.exists({
      evoucher: evoucherId,
      user: userId,
      isUsed: false,
    }) : false,
    evoucher.maxClaims ? evoucherCodeModel.countDocuments({
      evoucher: evoucherId,
      user: { $ne: null },
      isUsed: false,
    }) : 0
  ]);

  const reachMaximumClaim = evoucher.maxClaims !== undefined && currentClaims >= evoucher.maxClaims;
  const canClaim = !userHas && !reachMaximumClaim;

  return {
    ...evoucher.toJSON(),
    claims: {
      userHas: !!userHas,
      reachMaximumClaim,
      canClaim
    }
  };
};

