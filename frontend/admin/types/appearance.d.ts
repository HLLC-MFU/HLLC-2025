import { School } from "./school";

export type Appearance = {
    _id: string;
    school: School;
    colors: Record<string, string>;
    assets: Record<string, string>;
};