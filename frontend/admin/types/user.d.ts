import { Lang } from "./lang";
import { Role } from "./role";
import { School } from "./school";

export type User = {
    _id: string;
    name: {
        first: string;
        middle?: string;
        last?: string;
    };
    username: string;
    role: Role;
    metadata?: Metadata[];
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
};

export type Metadata = {
    major: {
        _id: string;
        name: Lang;
        school: School;
    };
}