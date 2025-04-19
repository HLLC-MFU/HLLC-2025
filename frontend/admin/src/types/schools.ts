import { Majors } from "./majors";

export interface Schools {
    id: number;
    name: string;
    details: string;
    acronym: string;
    majors: Majors[];
    createdAt: string;
}