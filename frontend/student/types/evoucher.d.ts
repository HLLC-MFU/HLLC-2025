export type IEvoucher = {
  _id: string;
  discount: string;
  acronym: string;
  type: 'GLOBAL' | 'INDIVIDUAL';
  sponsors: {
    _id: string;
    name: {
      en: string;
      th: string;
    };
    photo: {
      logoPhoto: string;
    };
    type: {
      _id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
    isShow: boolean;
    createdAt: string;
    updatedAt: string;
  };
  sponsor?: string;
  detail: {
    en: string;
    th: string;
  };
  expiration: string;
  photo: {
    home?: string;
    front?: string;
    back?: string;
    coverPhoto?: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
  maxClaims: number;
  claims?: {
    maxClaim: number;
    currentClaim: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type IEvoucherCode = {
  _id: string;
  code: string;
  user: string;
  evoucher: IEvoucher;
  isUsed: boolean;
  metadata: {
    expiration: string;
  };
  createdAt: string;
  updatedAt: string;
  canUse: boolean;
}

export type IEvoucherResponse = {
  data: IEvoucher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lastUpdatedAt: string;
  };
  message: string;
}

export type IEvoucherCodeResponse = {
  data: IEvoucherCode[] | { data: IEvoucherCode[]; meta?: any; message?: string };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lastUpdatedAt: string;
  };
  message: string;
}