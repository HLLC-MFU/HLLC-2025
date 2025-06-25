import { Lang } from "./lang";
import { School } from "./school";

export type Major = {
    _id?: string;
    name: Lang;
    acronym: string;
    detail: Lang;
    school: School | string;
};