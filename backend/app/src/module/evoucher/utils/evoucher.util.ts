import { BadRequestException, ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import {
  EvoucherDocument,
  EvoucherType,
  EvoucherStatus,
  Evoucher,
} from '../schema/evoucher.schema';
import {
  EvoucherCode,
  EvoucherCodeDocument,
} from '../schema/evoucher-code.schema';
import { SponsorsDocument } from 'src/module/sponsors/schema/sponsors.schema';

export type PopulatedEvoucherCode = Omit<EvoucherCode, 'evoucher'> & {
  _id: Types.ObjectId;
  evoucher: Omit<Evoucher, 'sponsors'> & {
    sponsors: SponsorsDocument;
  };
};

const generateRandomNumber = (length = 8): string =>
  String(Math.floor(Math.random() * 10 ** length)).padStart(length, '0');

const generateCode = (prefix: string) => `${prefix}${generateRandomNumber()}`;

export const validateEvoucher = async (
  evoucherId: string,
  evoucherModel: Model<EvoucherDocument>,
) => {
  const evoucher = await evoucherModel.findById(evoucherId);
  if (!evoucher) throw new BadRequestException('Evoucher not found');
  validateEvoucherState(evoucher);
  return evoucher;
};

export const validateEvoucherState = (
  evoucher: EvoucherDocument,
  now = new Date(),
) => {
  if (now > new Date(evoucher.expiration))
    throw new BadRequestException('Evoucher expired');
  if (evoucher.status !== EvoucherStatus.ACTIVE)
    throw new BadRequestException('Evoucher inactive');
};

export const validateClaimEligibility = async (
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
) => {
  if (evoucher.type !== EvoucherType.GLOBAL) {
    throw new BadRequestException('This type is not claimable');
  }

  const [hasClaimed, currentClaims] = await Promise.all([
    evoucherCodeModel.findOne({
      user: new Types.ObjectId(userId),
      evoucher: evoucher._id,
    }),
    evoucher.maxClaims
      ? evoucherCodeModel.countDocuments({
          evoucher: evoucher._id,
          user: { $ne: null },
          isUsed: false,
        })
      : 0,
  ]);

  if (hasClaimed)
    throw new BadRequestException('You already have this evoucher');
  if (evoucher.maxClaims && currentClaims >= evoucher.maxClaims) {
    throw new BadRequestException('Maximum claims reached for this evoucher');
  }
};

export const createEvoucherCode = async (
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
) => {
  const userObjectId = new Types.ObjectId(userId);

  // Try to find an available code first
  const availableCode = await evoucherCodeModel.findOneAndUpdate(
    { evoucher: evoucher._id, user: null, isUsed: false },
    { user: userObjectId },
    { new: true },
  );

  if (availableCode) return availableCode;

  // Generate new code if no available code found
  for (let retry = 0; retry < 3; retry++) {
    const code = generateCode(evoucher.acronym);

    return await evoucherCodeModel.create({
      code,
      evoucher: evoucher._id,
      user: userObjectId,
      isUsed: false,
      metadata: {},
    });
  }
  throw new ConflictException('Unable to generate unique code after retries');
};

export const useEvoucherCode = async (
  userId: Types.ObjectId,
  codeId: string,
  model: Model<EvoucherCodeDocument>,
) => {
  const code = await model.findById(codeId).populate('evoucher');
  if (!code) throw new BadRequestException('Code not found');

  const evoucher = code.evoucher as unknown as EvoucherDocument;
  validateEvoucherState(evoucher);

  if (!code.user.equals(userId))
    throw new BadRequestException('Code does not belong to you');
  if (code.isUsed) throw new BadRequestException('Code already used');

  code.isUsed = true;
  return await code.save();
};

export const validatePublicAvailableVoucher = async (
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string,
) => {
  const isExpire = new Date(evoucher.expiration) < new Date();
  const isInvalid =
    isExpire ||
    evoucher.type !== EvoucherType.GLOBAL ||
    evoucher.status !== EvoucherStatus.ACTIVE;

  if (isInvalid) {
    return {
      ...(evoucher.toJSON?.() ?? evoucher),
      claims: {
        userHas: false,
        reachMaximumClaim: false,
        canClaim: false,
        isExpire,
      },
    };
  }

  const [userHas, currentClaims = 0] = await Promise.all([
    userId
      ? evoucherCodeModel.exists({
          evoucher: evoucher._id,
          user: userId,
          isUsed: false,
        })
      : false,
    evoucher.maxClaims
      ? evoucherCodeModel.countDocuments({
          evoucher: evoucher._id,
          user: { $ne: null },
          isUsed: false,
        })
      : 0,
  ]);

  const reachMaximumClaim =
    evoucher.maxClaims && currentClaims >= evoucher.maxClaims;
  return {
    ...(evoucher.toJSON?.() ?? evoucher),
    claims: {
      userHas: !!userHas,
      reachMaximumClaim: !!reachMaximumClaim,
      canClaim: !userHas && !reachMaximumClaim,
      isExpire,
    },
  };
};

export const validateEvoucherCodeForUsage = (
  evoucherCode: EvoucherCodeDocument,
  userId: Types.ObjectId,
  evoucher: EvoucherDocument,
) => {
  if (!evoucherCode.user.equals(userId))
    throw new BadRequestException('This evoucher code does not belong to you');
  if (evoucherCode.isUsed)
    throw new BadRequestException('This evoucher code has already been used');
  if (evoucher.status !== EvoucherStatus.ACTIVE)
    throw new BadRequestException('This evoucher is not active');
  if (new Date() > new Date(evoucher.expiration))
    throw new BadRequestException('This evoucher has expired');
};
