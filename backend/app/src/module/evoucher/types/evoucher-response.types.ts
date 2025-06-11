export interface AvailableEvoucherResponse {
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
  isClaimable: boolean;
  userHasEvoucher: boolean;
  availableCount: number;
  expired: boolean;
  canClaim: boolean;
}

export interface UserEvoucherCodeResponse {
  _id: string;
  code: string;
  user: string;
  evoucher: {
    _id: string;
    discount: number;
    acronym: string;
    detail: {
      th: string;
      en: string;
    };
    type: {
      name: string;
      key: string;
    };
    sponsors: {
      name: string;
      logo?: string;
    };
    expiration: Date;
  };
  isUsed: boolean;
  expired: boolean;
  canUse: boolean;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
} 