import { Lang } from "./lang";

export type Evoucher = {
    _id: string;
    discount: number;
    acronym: string;
    type: Type;
    sponsor: Sponsor;
    detail: Lang;
    expiration: Date;
    photo: Photo;
};

export type Type = {
    _id: string;
    name: string;
};

export type Sponsor = {
    _id: string;
    name: Lang;
    photo: {
        logoPhoto: string;
    };
    type: string;
    isShow: boolean;
};

export type Photo = {
    coverPhoto?: string;
    bannerPhoto?: string;
    thumbnail?: string;
    logoPhoto?: string;
};