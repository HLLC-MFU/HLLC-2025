import { Lang } from './lang';
export class Location {
  latitude: number;
  longitude: number;
  mapUrl: string;
  th: string;
  en: string;
}

export type mapCoordinate = {
  x: number;
  y: number;
};

export type Activities = {
    _id: string;
    name: Lang;
    acronym: string;
    fullDetails: Lang;
    shortDetails: Lang;
    type: ActivityType | string;
    photo: Photo;
    location: Location;
    metadata: Metadata;
    createdAt?: string;
    updatedAt?: string;
};

export type Photo = {
    bannerPhoto: string;
    logoPhoto: string;
};

export type Metadata = {
    isOpen: boolean;
    isProgressCount: boolean;
    isVisible: boolean;
    scope: Scope;
    checkinStartAt?: string;
    startAt?: string;
    endAt?: string;
};

export type ScopeDetails = {
    name: Lang;
    _id: string;
}

export type Scope = {
    major: ScopeDetails[];
    school: ScopeDetails[];
    user: ScopeDetails[];
};

export type ActivityType = {
    _id: string;
    name: string;
    photo?: Photo;
};