import { Lang } from "./lang";
import { Major } from "./major";
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
    role: Role | string;
    metadata?: Record<string | string>;
};

export type UserName = {
    first: string;
    middle?: string;
    last: string;
};