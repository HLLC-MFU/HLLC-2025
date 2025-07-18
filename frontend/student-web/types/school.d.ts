import { Lang } from './lang';
import { Major } from './major';

export type School = {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
    majors: Major[];
};

export type Photo = {
    first: string;
    second: string;
    third: string;
    fourth: string;
};
