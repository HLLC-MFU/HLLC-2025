import { User } from "./user";

export type LamduanFlower = {
    _id: string;
    user: User;
    comment: string;
    photo: string;
    createdAt: string;
    setting: Setting;
};

export type Setting = {
    startAt: Date;
    endAt: Date;
};

export type LamduanSetting = {
    _id: string;
    tutorialPhoto: string;
    tutorialVideo: string;
    startAt: string;
    endAt: string;
    createdAt: string;
};