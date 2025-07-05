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
    metadata: RoomMetadata;
};

export type Members = {
    _id: string;
    username: string;
    name: {
        first: string;
        middle?: string;
        last: string;
    };
    role: string;
    joinedAt: string;
};

export enum RoomType {
    NORMAL = "normal",
    READONLY = "readonly",
}

export type RoomMetadata = {
    groupType?: "school" | "major" | "global";
    description?: string;
    tags?: string[];
    settings?: {
        allowFileUpload?: boolean;
        maxFileSize?: number;
        allowedFileTypes?: string[];
        moderationEnabled?: boolean;
    };
    [key: string]: any;
};

export type Name = {
    en: string;
    th: string;
};

export type Message = {
    _id: string;
    roomId: string;
    userId: string;
    message: string;
    type: MessageType;
    replyTo?: Message;
    mentions?: string[];
    attachments?: Attachment[];
    createdAt: string;
    updatedAt: string;
};

export enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    FILE = "file",
    SYSTEM = "system",
}

export type Attachment = {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
};

export type ChatStats = {
    totalRooms: number;
    totalMessages: number;
    activeUsers: number;
    totalMembers: number;
};

