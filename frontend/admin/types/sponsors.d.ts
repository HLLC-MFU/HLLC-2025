import { Lang } from './lang';

export type Sponsors = {
    _id: string;
    name: Lang;
    photo: string;
    type: SponsorType;
    isShow: boolean;
}

export type SponsorType = {
    _id: string;
    name: string;
}