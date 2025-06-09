export interface EvoucherCode {
  _id: string;
  code: string;
  isUsed: boolean;
  evoucher: {
    _id: string;
    discount: number;
    acronym: string;
    type: string;
    sponsors: string;
    detail: {
      th: string;
      en: string;
    };
    expiration: string;
    photo: {
      coverPhoto: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  user?: string;
  metadata: {
    expiration: string;
  };
  createdAt: string;
  updatedAt: string;
} 