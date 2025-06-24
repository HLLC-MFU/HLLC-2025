import { Lang } from './lang';
import { Photo } from './photo';

export type Sponsors = {
    _id: string;
    name: Lang;
    photo: Photo;
    type: SponsorType;
    isShow: boolean;
}

export type SponsorType = {
    _id: string;
    name: string;
}