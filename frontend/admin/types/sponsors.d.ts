import { Lang } from "./lang";
import { SponsorType } from "./sponsors-type";

export type Sponsors = {
    name: Lang,
    photo: Photo,
    type: SponsorType,
    isShow: boolean,
};

export type Photo = {
  coverPhoto?: string;
  bannerPhoto?: string;
  thumbnail?: string;
  logoPhoto?: string;
};