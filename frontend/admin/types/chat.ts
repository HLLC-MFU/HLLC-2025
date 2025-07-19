import type { Room, RoomType, RoomSchedule, Name, RoomMetadata } from './room';

// Re-export commonly used types for convenience
export type { Room, RoomType, RoomSchedule, Name, RoomMetadata };

export type Members = {
    _id: string;
    username: string;
    name: {
        first: string;
        middle?: string;
        last: string;
    };
    role: {
        _id: string;
        name: string;
    };
};

// **Evoucher types**
export type EvoucherData = {
    roomId: string;
    message: {
        th: string;
        en: string;
    };
    claimUrl: string;
    sponsorImage: string;
};

export type EvoucherResponse = {
    success: boolean;
    message: string;
    data?: {
        id: string;
        room_id: string;
        message: {
            th: string;
            en: string;
        };
        claimUrl: string;
        sponsorImage: string;
        timestamp: string;
    };
};

// **User restriction types**
export type RestrictionAction = {
    userId: string;
    roomId: string;
    action: 'ban' | 'mute' | 'kick' | 'unban' | 'unmute';
    duration?: 'temporary' | 'permanent';
    timeValue?: number;
    timeUnit?: 'minutes' | 'hours';
    restriction?: 'can_view' | 'cannot_view';
    restrictorId?: string;
    reason: string;
};

export type RestrictionResponse = {
    success: boolean;
    message: string;
    data?: {
        id: string;
        type: string;
        duration: string;
        reason: string;
        startTime: string;
        endTime?: string;
        status: string;
        restrictor: string;
    };
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

