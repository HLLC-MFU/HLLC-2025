export type Activities = {
    _id: string;
    name: Lang;
    acronym: string;
    fullDetails: Lang;
    shortDetails: Lang;
    location: Lang;
    photo: Photo;
    metadata: metadata;
}

export type metadata = {
    isOpen: boolean;
    isProgrssCount: boolean;
    isVisible: boolean;
    scope: Scope;
}

export type Scope = {
    major: string[];
    school: string[];
    user: string[];
}

export type Photo = {
    coverPhoto: string;
    bannerPhoto: string;
    thumbnail: string;
    logoPhoto: string;
}