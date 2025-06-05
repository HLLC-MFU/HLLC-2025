import { Lang } from "./lang";

export type Sponsor = {
    _id: string;
    name: Lang;
    // logo: Photo;
    logo: Photo;
    type: string;
    isShow: boolean;
}

export type Photo = {
    coverPhoto: string;
    bannerPhoto: string;
    thumbnail: string;
    logoPhoto: string;
};

export type Type = {
    _id: string;
    name: string;
}