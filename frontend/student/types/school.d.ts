import { Lang } from './lang';

export interface School {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
};

export interface Photo {
    avatar: string;
    first: string;
    second: string;
    third: string;
    fourth: string;
};
