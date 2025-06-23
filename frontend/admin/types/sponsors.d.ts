import { Lang } from './lang';
import { Photo } from './photo';

export type Sponsors = {
    _id: string;
    name: Lang;
    photo: Photo;
    type: string;
    isShow: boolean;
}
