import { Lang } from "./lang";
import { Campaign } from "./campaign";

export type Evoucher = {
    discount: number;
    acronym: string;
    type: Type;
    sponsors: Sponsor;
    campaign: Campaign;
    detail: Lang;
    expiration: Date;
    photo: Photo;
    metadata: Record<string, any>;
};

export type Sponsor = {
    name: Lang;
    photo: Photo;
    type: Type;
    isShow: boolean;
    metadata: Record<string, any>;
};

export type Type = {
    name: string;
};

export type Photo = {
    coverPhoto: string;
    bannerPhoto: string;
    thumbnail: string;
    logoPhoto: string;
};