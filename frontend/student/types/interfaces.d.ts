import { School } from "./school";

export interface InterfaceData {
    id: string;
    school: School;
    assets: Record<string, string>;
}

export interface Interfaces {
    data: InterfaceData[],
    message: string;
}