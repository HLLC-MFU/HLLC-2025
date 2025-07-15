import Lang from './lang';

export type Evouchers = {
  _id: string;
  name: Lang;
  acronym: string;
  order: number;
  startAt: Date;
  endAt: Date;
  detail: Localization;
  photo: Photo;
  sponsor: Types.ObjectId;
  metadata?: Record<string, string>;
};

export type Photo = {
  home: string;
  front: string;
  back: string;
};

export type EvoucherCodes = {
  _id: string;
  code: string;
  isUsed: boolean;
  usedAt?: Date;
  user: Types.ObjectId;
  evoucher: Evouchers;
  metadata?: Record<string, string | number>;
};