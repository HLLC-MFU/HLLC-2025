import { User } from "./user"
import { Lang } from './lang';

export type CoinHunting = {
    _id: string
    user: User
    landmark: Landmark[] | null
    rank: number
    coinCount: number
    latestCollectedAt: string
    userId: string
}

export type Leaderboard = {
    rank: number
    coinCount: number
    latestCollectedAt: string
    userId: string
    username: string,
    name: {
        first: string,
        middle: string,
        last: string,
    }
}

export type Normalboard = {
    rank: number
    coinCount: number
    latestCollectedAt: string
    userId: string
    username: string,
    name: {
        first: string,
        middle: string,
        last: string,
    }
}

export type Sponsorboard = {
    rank: number
    coinCount: number
    latestCollectedAt: string
    userId: string
    username: string,
    name: {
        first: string,
        middle: string,
        last: string,
    }
}

type Landmark = {
    _id: string

    name: Lang;

    order: number

    coinImage: string;

    hint: Lang

    hintImage: string;

    location: Location;

    cooldown: number;

    limitDistance: number

    type: LandmarkType;


    mapCoordinates: mapCoordinate;
}

enum LandmarkType {
    NORMAL = 'normal',
    SPONSOR = 'sponsor'
}

type Location = {
    latitude: number
    longitude: number
    mapUrl: string
}

type mapCoordinate = {
    x: number
    y: number
}