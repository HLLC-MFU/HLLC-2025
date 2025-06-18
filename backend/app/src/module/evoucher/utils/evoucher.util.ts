import { BadRequestException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { EvoucherDocument, EvoucherType, EvoucherStatus } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';
import { EvoucherCodeSequenceDocument } from '../schema/evoucher-code-sequence.schema';

const codeNumberCache: { [key: string]: number } = {};

function initializeCache(prefix: string, lastKnownNumber: number = 0) {
  if (!codeNumberCache[prefix]) {
    codeNumberCache[prefix] = lastKnownNumber;
  }
}

function getNextNumber(prefix: string): number {
  return ++codeNumberCache[prefix];
}

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
  const prefix = evoucher.acronym;
  const pattern = new RegExp(`^${prefix}([A-Z])?-(\\d+)$`);
  
  // Initialize cache if needed
  if (!codeNumberCache[prefix]) {
    const lastNumber = existingCodes.reduce((max, code) => {
      const match = code.code.match(pattern);
      if (!match) return max;
      const [, letter, num] = match;
      return Math.max(max, letter ? (letter.charCodeAt(0) - 65) * 1000000 + +num : +num);
    }, 0);
    initializeCache(prefix, lastNumber);
  }

  const nextCode = (n: number) => n < 1000000 
    ? `${prefix}-${String(n).padStart(6, '0')}`
    : `${prefix}${String.fromCharCode(65 + Math.floor(n / 1000000))}-${String(n % 1000000).padStart(6, '0')}`;

  if (count === 1) {
    return nextCode(getNextNumber(prefix));
  }

  return Array.from(
    { length: count }, 
    () => ({
      code: nextCode(getNextNumber(prefix)),
      evoucher: evoucher._id.toString(),
      user: dto.user,
      isUsed: false,
      metadata: dto.metadata || {}
    })
  );
}

// Reset cache for testing or when needed
export function resetCodeNumberCache(prefix?: string) {
  if (prefix) {
    delete codeNumberCache[prefix];
  } else {
    Object.keys(codeNumberCache).forEach(key => delete codeNumberCache[key]);
  }
}
  

async function getNextEvoucherCode(
  prefix: string,
  sequenceModel: Model<EvoucherCodeSequenceDocument>
): Promise<string> {
  const { lastNumber } = await sequenceModel.findOneAndUpdate(
    { prefix },
    { $inc: { lastNumber: 1 } },
    { new: true, upsert: true }
  );

  return lastNumber < 1000000 
    ? `${prefix}-${String(lastNumber).padStart(6, '0')}`
    : `${prefix}${String.fromCharCode(65 + Math.floor(lastNumber / 1000000))}-${String(lastNumber % 1000000).padStart(6, '0')}`;
}

const generateCode = (prefix: string, n: number) => n < 1000000 
  ? `${prefix}-${String(n).padStart(6, '0')}`
  : `${prefix}${String.fromCharCode(65 + Math.floor(n / 1000000))}-${String(n % 1000000).padStart(6, '0')}`;

const validateEvoucherState = (evoucher: EvoucherDocument, now = new Date()) => {
  if (now > new Date(evoucher.expiration) || evoucher.status !== EvoucherStatus.ACTIVE) {
    throw new BadRequestException(
      now > new Date(evoucher.expiration) ? 'Evoucher expired' : 'Evoucher inactive'
    );
  }
};

export async function claimVoucherCode(
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  sequenceModel: Model<EvoucherCodeSequenceDocument>
) {
  validateEvoucherState(evoucher);
  if (evoucher.type !== EvoucherType.GLOBAL) {
    throw new BadRequestException('This type is not claimable');
  }

  const userObjectId = new Types.ObjectId(userId);
  const [hasClaimed, currentClaims, availableCode] = await Promise.all([
    evoucherCodeModel.findOne({ user: userObjectId, evoucher: evoucher._id }),
    evoucher.maxClaims ? evoucherCodeModel.countDocuments({
      evoucher: evoucher._id,
      user: { $ne: null },
      isUsed: false
    }) : 0,
    evoucherCodeModel.findOneAndUpdate(
      { evoucher: evoucher._id, user: null, isUsed: false },
      { user: userObjectId },
      { new: true }
    )
  ]);

  if (hasClaimed || (evoucher.maxClaims && currentClaims >= evoucher.maxClaims)) {
    throw new BadRequestException(
      hasClaimed ? 'You already have this evoucher' : 'Maximum claims reached'
    );
  }

  if (availableCode) return availableCode;

  for (let retry = 0; retry < 3; retry++) {
    try {
      const { lastNumber } = await sequenceModel.findOneAndUpdate(
        { prefix: evoucher.acronym },
        { $inc: { lastNumber: 1 } },
        { new: true, upsert: true }
      );

      return await evoucherCodeModel.create({
        code: generateCode(evoucher.acronym, lastNumber),
        evoucher: evoucher._id,
        user: userObjectId,
        isUsed: false,
        metadata: {}
      });
    } catch (error) {
      if (error.code !== 11000 || retry === 2) throw error;
    }
  }
  throw new ConflictException('Unable to generate unique code after retries');
}

export async function useEvoucherCode(
  userId: Types.ObjectId,
  codeId: string,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) {
  const code = await evoucherCodeModel.findById(codeId).populate('evoucher').exec();
  if (!code) throw new BadRequestException('Code not found');

  const evoucher = code.evoucher as unknown as EvoucherDocument;
  validateEvoucherState(evoucher);

  if (!code.user.equals(userId) || code.isUsed) {
    throw new BadRequestException(
      !code.user.equals(userId) ? 'Code does not belong to you' : 'Code already used'
    );
  }

  code.isUsed = true;
  return await code.save();
}

export async function validatePublicAvailableVoucher(
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string
) {
  const isExpire = evoucher.expiration && new Date(evoucher.expiration) < new Date();
  const isInvalid = isExpire || evoucher.type !== 'GLOBAL' || evoucher.status !== EvoucherStatus.ACTIVE;

  if (isInvalid) {
    return {
      ...(evoucher.toJSON?.() ?? evoucher),
      claims: { userHas: false, reachMaximumClaim: false, canClaim: false, isExpire }
    };
  }

  const [userHas, currentClaims = 0] = await Promise.all([
    userId && evoucherCodeModel.exists({
      evoucher: evoucher._id,
      user: userId,
      isUsed: false,
    }),
    evoucher.maxClaims && evoucherCodeModel.countDocuments({
      evoucher: evoucher._id,
      user: { $ne: null },
      isUsed: false,
    })
  ]);

  const reachMaximumClaim = evoucher.maxClaims && currentClaims >= evoucher.maxClaims;
  return {
    ...(evoucher.toJSON?.() ?? evoucher),
    claims: {
      userHas: !!userHas,
      reachMaximumClaim: !!reachMaximumClaim,
      canClaim: !userHas && !reachMaximumClaim,
      isExpire
    }
  };
}

export async function validateEvoucherCodeForUsage(
  evoucherCode: EvoucherCodeDocument,
  userId: Types.ObjectId,
  evoucher: EvoucherDocument
): Promise<void> {
  if (!evoucherCode.user.equals(userId)) {
    throw new BadRequestException('This evoucher code does not belong to you');
  }
  if (evoucherCode.isUsed) {
    throw new BadRequestException('This evoucher code has already been used');
  }
  if (evoucher.status !== EvoucherStatus.ACTIVE) {
    throw new BadRequestException('This evoucher is not active');
  }
  if (new Date() > new Date(evoucher.expiration)) {
    throw new BadRequestException('This evoucher has expired');
  }
}