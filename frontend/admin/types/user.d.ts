import { Lang } from "./lang";
import { Major } from "./major";
import { Role } from "./role";

export type User = {
    _id: string;
    name: {
        first: string;
        middle?: string;
        last?: string;
    };
    username: string;
    role: Role;
    metadata?: {
        major?: Major
    };
};