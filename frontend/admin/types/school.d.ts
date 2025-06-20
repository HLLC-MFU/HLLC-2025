import { Lang } from './lang';

export type School = {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
};

export type Photo = {
    first: string;
    second: string;
    third: string;
    fourth: string;
};
