// backend/app/src/module/evoucher/utils/evoucher.util.ts

import { BadRequestException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { EvoucherDocument, EvoucherType, EvoucherStatus } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { CreateEvoucherCodeDto } from '../dto/evoucher-codes/create-evoucher-code.dto';

export const validateEvoucherExpired = async (
  evoucherId: string,
  evoucherModel: Model<EvoucherDocument>
) => {
  const evoucher = await evoucherModel.findById(evoucherId);
  if (!evoucher) throw new BadRequestException('Evoucher not found');
  if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('Evoucher expired');
  return evoucher;
};

export const validateEvoucherTypeClaimable = (type: EvoucherType) => {
  if (type !== EvoucherType.GLOBAL) throw new BadRequestException('This type is not claimable');
};

export const validateUserDuplicateClaim = async (
  userId: string,
  evoucherId: string,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) => {
  const exists = await evoucherCodeModel.findOne({
    user: new Types.ObjectId(userId),
    evoucher: new Types.ObjectId(evoucherId),
  });
  if (exists) throw new BadRequestException('You already have this evoucher');
};

export const validateEvoucherState = (evoucher: EvoucherDocument, now = new Date()) => {
  if (now > new Date(evoucher.expiration)) throw new BadRequestException('Evoucher expired');
  if (evoucher.status !== EvoucherStatus.ACTIVE) throw new BadRequestException('Evoucher inactive');
};

export const validateMaxClaims = async (
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) => {
  if (!evoucher.maxClaims) return;
  
  const currentClaims = await evoucherCodeModel.countDocuments({
    evoucher: evoucher._id,
    user: { $ne: null },
    isUsed: false
  });

  if (currentClaims >= evoucher.maxClaims) {
    throw new BadRequestException('Maximum claims reached for this evoucher');
  }
};

const generateRandomNumber = (length = 8): string =>
  String(Math.floor(Math.random() * 10 ** length)).padStart(length, '0');

const generateCode = (prefix: string) => `${prefix}${generateRandomNumber()}`;

const isCodeUnique = async (code: string, model: Model<EvoucherCodeDocument>) => {
  return !(await model.exists({ code }));
};

export const generateEvoucherCode = (
  dto: CreateEvoucherCodeDto & { count?: number },
  evoucher: EvoucherDocument
): string | CreateEvoucherCodeDto[] => {
  const count = dto.count ?? 1;
  const generate = () => `${evoucher.acronym}${generateRandomNumber()}`;

  return count === 1
    ? generate()
    : Array.from({ length: count }, () => ({
        code: generate(),
        evoucher: evoucher._id.toString(),
        user: dto.user,
        isUsed: false,
        metadata: dto.metadata || {}
      }));
};

export const claimVoucherCode = async (
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) => {
  validateEvoucherState(evoucher);
  validateEvoucherTypeClaimable(evoucher.type);

  const userObjectId = new Types.ObjectId(userId);
  const [hasClaimed, currentClaims, availableCode] = await Promise.all([
    evoucherCodeModel.findOne({ user: userObjectId, evoucher: evoucher._id }),
    evoucher.maxClaims
      ? evoucherCodeModel.countDocuments({ evoucher: evoucher._id, user: { $ne: null }, isUsed: false })
      : 0,
    evoucherCodeModel.findOneAndUpdate(
      { evoucher: evoucher._id, user: null, isUsed: false },
      { user: userObjectId },
      { new: true }
    )
  ]);

  if (hasClaimed) throw new BadRequestException('You already have this evoucher');
  if (evoucher.maxClaims && currentClaims >= evoucher.maxClaims)
    throw new BadRequestException('Maximum claims reached');

  if (availableCode) return availableCode;

  for (let retry = 0; retry < 3; retry++) {
    const code = generateCode(evoucher.acronym);
    if (!(await isCodeUnique(code, evoucherCodeModel))) continue;
    try {
      return await evoucherCodeModel.create({
        code,
        evoucher: evoucher._id,
        user: userObjectId,
        isUsed: false,
        metadata: {}
      });
    } catch (err) {
      if (err.code !== 11000 || retry === 2) throw err;
    }
  }
  throw new ConflictException('Unable to generate unique code after retries');
};

export const useEvoucherCode = async (
  userId: Types.ObjectId,
  codeId: string,
  model: Model<EvoucherCodeDocument>
) => {
  const code = await model.findById(codeId).populate('evoucher');
  if (!code) throw new BadRequestException('Code not found');

  const evoucher = code.evoucher as unknown as EvoucherDocument;
  validateEvoucherState(evoucher);

  if (!code.user.equals(userId)) throw new BadRequestException('Code does not belong to you');
  if (code.isUsed) throw new BadRequestException('Code already used');

  code.isUsed = true;
  return await code.save();
};

export const validatePublicAvailableVoucher = async (
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string
) => {
  const isExpire = new Date(evoucher.expiration) < new Date();
  const isInvalid = isExpire || evoucher.type !== 'GLOBAL' || evoucher.status !== EvoucherStatus.ACTIVE;

  if (isInvalid)
    return {
      ...(evoucher.toJSON?.() ?? evoucher),
      claims: { userHas: false, reachMaximumClaim: false, canClaim: false, isExpire }
    };

  const [userHas, currentClaims = 0] = await Promise.all([
    userId
      ? evoucherCodeModel.exists({ evoucher: evoucher._id, user: userId, isUsed: false })
      : false,
    evoucher.maxClaims
      ? evoucherCodeModel.countDocuments({ evoucher: evoucher._id, user: { $ne: null }, isUsed: false })
      : 0
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
};

export const validateEvoucherCodeForUsage = async (
  evoucherCode: EvoucherCodeDocument,
  userId: Types.ObjectId,
  evoucher: EvoucherDocument
) => {
  if (!evoucherCode.user.equals(userId)) throw new BadRequestException('This evoucher code does not belong to you');
  if (evoucherCode.isUsed) throw new BadRequestException('This evoucher code has already been used');
  if (evoucher.status !== EvoucherStatus.ACTIVE) throw new BadRequestException('This evoucher is not active');
  if (new Date() > new Date(evoucher.expiration)) throw new BadRequestException('This evoucher has expired');
};