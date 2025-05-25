import { Lang } from "./lang";

export type School = {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
    majors: Major[];
}

export type Major = {
    _id?: string;
    name: Lang;
    detail: Lang;
    acronym: string;
    school: string;
}

export type Photo = {
    first: string;
    second: string;
    third: string;
    fourth: string;
}

