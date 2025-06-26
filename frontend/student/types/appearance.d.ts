import { School } from "./school";

export interface AppearanceData {
    id: string;
    school: School;
    colors: Record<string, string>;
    assets: Record<string, string>;
}

export interface Appearance {
    data: AppearanceData[],
    message: string;
}