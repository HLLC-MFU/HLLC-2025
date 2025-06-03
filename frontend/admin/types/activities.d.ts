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

export type Type = {
    _id: string;
    name: string;
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
    bannerPhoto: string;
    logoPhoto: string;
}