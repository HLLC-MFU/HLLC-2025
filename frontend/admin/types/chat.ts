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

// **NEW: Room Member with additional fields**
export type RoomMember = {
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
    joinedAt: string;
    isOnline?: boolean;
    lastSeen?: string;
};

// **NEW: Evoucher types**
export type EvoucherData = {
    roomId: string;
    userIds: string[];
    evoucherId: string;
    message?: string;
};

export type EvoucherResponse = {
    success: boolean;
    message: string;
    data?: {
        id: string;
        room_id: string;
        user_id: string;
        timestamp: string;
        evoucherInfo: {
            title: string;
            description: string;
            claimUrl: string;
        };
    };
};

// **NEW: User restriction types**
export type RestrictionAction = {
    userId: string;
    roomId: string;
    action: 'ban' | 'mute' | 'kick' | 'unban' | 'unmute';
    duration?: 'temporary' | 'permanent';
    timeValue?: number;
    timeUnit?: 'minutes' | 'hours';
    restriction?: 'can_view' | 'cannot_view';
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

// **NEW: Room members response**
export type RoomMembersResponse = {
    success: boolean;
    message: string;
    data: {
        _id: string;
        members: Array<{
            user: {
                _id: string;
                username: string;
                name: {
                    first: string;
                    middle?: string;
                    last: string;
                };
                role?: {
                    _id: string;
                    name: string;
                };
            };
        }>;
    };
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

