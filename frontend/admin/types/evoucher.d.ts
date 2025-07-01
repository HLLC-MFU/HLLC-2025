import { EvoucherType } from './evoucher-type';
import { Lang } from './lang';
import { Photo } from './photo';
import { Sponsors } from './sponsors';

type EvoucherPhoto = {
  front: string;
  back: string;
  home: string;
};

export type Evoucher = {
  _id: string;
  name: Lang;
  acronym: string;
  order: number;
  startAt: Date;
  endAt: Date;
  detail: Lang;
  photo: EvoucherPhoto;
  amount: number;
  sponsor: string;
};
