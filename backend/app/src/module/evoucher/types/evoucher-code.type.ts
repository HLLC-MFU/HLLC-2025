import { Types } from 'mongoose';
import { Evoucher, EvoucherDocument, EvoucherType } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';

export interface BulkGenerateInput {
  count: number;
  user: string;
  evoucher: string;
}

export type PopulatedEvoucherCode = Omit<EvoucherCodeDocument, 'evoucher'> & {
  evoucher: Evoucher;
};

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

export interface PublicAvailableResult {
  _id: string;
  discount: number;
  acronym: string;
  type: {
    _id: string;
    name: string;
    key: string;
    description: string;
  };
  sponsors: {
    _id: string;
    name: string;
    logo?: string;
  };
  detail: {
    th: string;
    en: string;
  };
  expiration: Date;
  photo: {
    url: string;
    alt?: string;
  };
}

export interface PublicEvoucherResponse {
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
  createdAt: Date;
  updatedAt: Date;
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
