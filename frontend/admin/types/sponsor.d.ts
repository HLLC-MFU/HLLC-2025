import { Lang } from "./lang";

export type Sponsor = {
    _id: string;
    name: Lang;
    // logo: Photo;
    logo: Photo;
    type: String;
    isShow: boolean;
}

export type Photo = {
    coverPhoto: string;
    bannerPhoto: string;
    thumbnail: string;
    logoPhoto: string;
};