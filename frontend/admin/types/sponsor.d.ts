import { Lang } from "./lang";

export type Sponsor = {
    _id: string;
    name: Lang;
    photo: Photo;
    type: string;
    isShow: boolean;
}

export type Photo = {
    logoPhoto: string;
};

export type Type = {
    _id: string;
    name: string;
}