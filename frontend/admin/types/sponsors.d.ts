import { Lang } from './lang';
import { SponsorType } from './sponsors-type';

export type Sponsors = {
    _id: string;
    name: Lang;
    photo: string;
    type: SponsorType;
    isShow: boolean;
}