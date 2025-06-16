import { Types } from 'mongoose';
import { EvoucherType } from '../schema/evoucher.schema';
import { SponsorsDocument } from 'src/module/sponsors/schema/sponsors.schema';
import { EvoucherDocument } from '../schema/evoucher.schema';

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

export interface SponsorName {
  th: string;
  en: string;
}

export interface SponsorPhoto {
  logoPhoto?: string;
}

export interface Sponsor {
  _id: string;
  name: SponsorName;
  photo: SponsorPhoto;
}

export interface EvoucherDetail {
  th: string;
  en: string;
}

export interface EvoucherPhoto {
  coverPhoto: string;
  bannerPhoto?: string;
  thumbnail?: string;
  logoPhoto?: string;
}

export interface PublicAvailableEvoucherResponse {
  _id: string;
  discount: number;
  acronym: string;
  type: EvoucherType;
  sponsors: Sponsor;
  detail: EvoucherDetail;
  expiration: Date;
  photo: EvoucherPhoto;
  userHas: boolean;
  totalClaims: number;
  canClaim: boolean;
  maxClaims: number;
}

export function formatEvoucherResponse(data: EvoucherDocument & { 
  userHas: boolean;  
  totalClaims: number; 
  canClaim: boolean;
  maxClaims: number;
  sponsors: SponsorsDocument;
}) {
  const response = {
    _id: data._id.toString(),
    discount: data.discount,
    acronym: data.acronym,
    type: data.type,
    sponsors: {
      _id: data.sponsors._id.toString(),
      name: data.sponsors.name,
      photo: data.sponsors.photo
    },
    detail: data.detail,
    expiration: data.expiration,
    photo: data.photo,
    userHas: data.userHas,
    totalClaims: data.totalClaims,
    canClaim: data.canClaim,
    maxClaims: data.maxClaims
  };

  return response;
}