export type Appearance = {
    _id: string;
    school: School;
    colors: Record<string, string>;
    assets: Record<string, string>;
};

export type School = {
    _id: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    photos: Photo;
    majors: Major[];
};

export type Photo = {
    coverPhoto: string;
    bannerPhoto: string;
    thumbnail: string;
    logoPhoto: string;
};

export type Lang = {
    th?: string;
    en?: string;
};

export type Major = {
    _id?: string;
    name: Lang;
    detail: Lang;
    acronym: string;
    school: string;
};
