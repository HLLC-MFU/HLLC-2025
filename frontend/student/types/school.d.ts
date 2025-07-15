import { Lang } from './lang';

export interface School {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
};

export interface Photo {
    first: string;
    second: string;
    third: string;
    fourth: string;
};
