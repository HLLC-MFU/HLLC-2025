import { Majors } from "./majors";

export interface Schools {
    id: string;
    name: string;
    details: string;
    acronym: string;
    major: Majors;
    createdAt: string;
}