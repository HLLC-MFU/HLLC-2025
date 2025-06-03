import { Lang } from "./lang";

export type User = {
    _id: string;
    name: UserName;
    username: string;
    role: Role;
    metadata?: Metadata[];
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
};

export type Role = {
    _id: string;
    name?: string;
};

export type Metadata = {
    major: {
        _id: string;
        name: Lang;
        school: School;
    };
}

export type School = {
    _id: string;
    name: Lang;
}