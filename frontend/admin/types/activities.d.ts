import { Lang } from './lang';

export type Activities = {
    _id: string;
    fullName: Lang;
    shortName: Lang;
    fullDetails: Lang;
    shortDetails: Lang;
    type: string;
    photo: Photo;
    location: string;
    tags: string[];
    metadata: Metadata;
    createdBy: string;
};

export type Photo = {
    bannerPhoto: string;
    logoPhoto: string;
};

export type Metadata = {
    isOpen: boolean;
    isProgrssCount: boolean;
    isVisible: boolean;
    scope: Scope;
};

export type Scope = {
    major: string[];
    school: string[];
    user: string[];
};

export type ActivityType = {
    _id: string;
    name: string;
};