import { Photo } from './photo';

export type Sponsors = {
  _id: string;
  name: Lang;
  logo: Photo;
  type: SponsorType;
  priority: number;
  color?: {
    primary: string;
    secondary: string;
  };
};

export type SponsorType = {
  _id: string;
  name: string;
  priority: number;
};
