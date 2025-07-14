import { Lang } from "./lang";

export enum LandmarkType {
    NORMAL = 'normal',
    SPONSOR = 'sponsor'
}

type mapCoordinate = {
    x: number;
    y: number;
}

type Location = {
    latitude: string;
    longitude: string;
    mapUrl : string;
}

export type Landmark = {
    _id?: string;
    name: Lang;
    hint: Lang;
    hintImage: string | File;
    coinImage: string | File;
    location: Location
    cooldown: number;
    order: number;
    type: LandmarkType;
    mapCoordinate: mapCoordinate;
    limitDistance: number;
}

