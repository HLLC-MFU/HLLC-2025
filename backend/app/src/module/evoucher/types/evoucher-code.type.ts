import { Types } from 'mongoose';
import { EvoucherType } from '../schema/evoucher.schema';

export interface BulkGenerateInput {
  count: number;
  user: string;
  evoucher: string;
}

export interface VoucherCodeInsert {
  code: string;
  evoucher: Types.ObjectId;
  user: Types.ObjectId;
  isUsed: boolean;
  metadata: {
    expiration: Date;
  };
}

export interface VoucherUpdateParams {
  currentVoucherIsUsed: boolean;
  updateIsUsed: boolean;
  evoucherExpiration: Date;
}


export interface PublicAvailableEvoucherResponse {
  _id: string;
  discount: number;
  acronym: string;
  type: EvoucherType;
  sponsors: {
    _id: string;
    name: {
      th: string;
      en: string;
    };
    photo: {
      logoPhoto?: string;
    };
  };
  detail: {
    th: string;
    en: string;
  };
  expiration: Date;
  photo: {
    coverPhoto: string;
    bannerPhoto?: string;
    thumbnail?: string;
    logoPhoto?: string;
  };
  userHas: boolean;
  totalClaims: number;
  canClaim: boolean;
}
