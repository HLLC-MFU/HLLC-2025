import { Lang } from "./lang";

export type Sponsor = {
    _id: string;
    name: Lang;
    description: Lang;
    // logo: Photo;
    logo: Photo;
    type: String;
    isShow: boolean;
}

export type Photo = {
    first: PhotoUrl;
    second: string;
    third: string;
    fourth: string;
}