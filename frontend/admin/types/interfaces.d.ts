import { School } from "./school";

export type Interfaces = {
    _id: string;
    school: School;
    assets: Record<string, string>;
};