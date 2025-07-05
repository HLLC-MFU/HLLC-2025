export type Room = {
    _id: string;
    name: Name;
    type: RoomType;
    capacity: number;
    memberCount: number;
    createdBy: string;
    image: string;
    createdAt: string;
    updatedAt: string;
    metadata: Record<string, any>; // ใช้ any เพราะอาจมีค่าเป็น boolean, string, number หรือ object
}

export type Members = {
    _id: string;
    username: string;
}

export enum RoomType {
    NORMAL = "normal",
    READONLY = "readonly",
}

type Name = {
    en: string;
    th: string;
}

