import { Lang } from "./lang";
import { School } from "./school";

export interface Major {
    _id?: string;
    name: Lang;
    detail: Lang;
    acronym: string;
    school: School;
};