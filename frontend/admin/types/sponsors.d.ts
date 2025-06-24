import { Lang } from './lang';
import { Photo } from './photo';
import { SponsorType } from './sponsors-type';

export type Sponsors = {
    _id: string;
    name: Lang;
    photo: Photo;
    type: SponsorType;
    isShow: boolean;
}