import { Lang } from './lang';

export type Activities = {
    _id: string;
    name: Lang;
    acronym: string;
    fullDetails: Lang;
    shortDetails: Lang;
    type: string;
    photo: Photo;
    location: Location;
    metadata: Metadata;
    createdAt?: string;
    updatedAt?: string;
};

export type Photo = {
    bannerPhoto: string;
    logoPhoto: string;
    coverPhoto: string;
    thumbnail?: string;
};

export type Metadata = {
    isOpen: boolean;
    isProgressCount: boolean;
    isVisible: boolean;
    scope: Scope;
    startAt: string;
    endAt: string;
    checkinStartAt: string;
    checkinStatus: boolean;
};

export type Scope = {
    major: string[];
    school: string[];
    user: string[];
};

export type ActivityType = {
    _id: string;
    name: string;
    photo?: Photo;
};

export type Location = {
    th: string;
    en: string;
    mapUrl: string;
    latitude: number;
    longitude: number;
}