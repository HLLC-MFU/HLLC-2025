// Types
export type Name = { en: string; th: string; };
export type RoomType = "normal" | "readonly";



export type RoomMetadata = {
    groupType?: "school" | "major" | "global";
    groupValue?: string;
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

export type Room = {
    _id: string;
    name: Name;
    type: RoomType;
    status?: "active" | "inactive";
    capacity: number;
    memberCount: number;
    createdBy: string;
    image?: string;
    createdAt?: string;
    updatedAt?: string;
    metadata?: RoomMetadata;
    canJoin?: boolean;
    isMember?: boolean;
};

// API Response types
export type RoomByIdResponse = Room;

export type RoomsByTypeResponse = {
    data: Room[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type RoomListResponse = {
    data: Room[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type RoomMembersResponse = {
    _id: string;
    name: Name;
    type: RoomType;
    members: RoomMember[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type RoomMember = {
    user: {
        _id: string;
        username: string;
        name?: {
            first: string;
            middle?: string;
            last: string;
        };
        Role?: {
            _id: string;
            name: string;
        };
    };
    restrictionStatus?: RestrictionStatus;
};

export type RestrictionStatus = {
    isBanned: boolean;
    isMuted: boolean;
    isKicked: boolean;
    banExpiry?: string;
    muteExpiry?: string;
    restriction?: 'can_view' | 'cannot_view';
    banReason?: string;
    muteReason?: string;
};

export type RestrictionHistoryResponse = {
    data: RestrictionHistoryItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type RestrictionHistoryItem = {
    id: string;
    type: string;
    duration: string;
    reason: string;
    status: string;
    start_time: string;
    end_time?: string;
    created_at: string;
    user?: {
        username: string;
        name?: {
            en?: string;
            th?: string;
        };
    };
    moderator?: {
        username: string;
        name?: {
            en?: string;
            th?: string;
        };
    };
};

export type RoomRestrictionsResponse = {
    [userId: string]: RestrictionStatus;
};

// Hook return types
export type UseRoomsByTypeReturn = {
    roomsByType: Record<string, RoomsByTypeResponse>;
    loading: Record<string, boolean>;
    error: Record<string, string | null>;
    fetchRoomsByType: (roomType: string, page?: number, limit?: number) => Promise<void>;
    loadMoreRooms: (roomType: string) => Promise<void>;
    refreshRooms: (roomType: string) => Promise<void>;
};

export type UseChatReturn = {
    rooms: Room[];
    loading: boolean;
    error: string | null;
    fetchRooms: () => Promise<void>;
    createRoom: (roomData: FormData) => Promise<void>;
    updateRoom: (id: string, roomData: FormData) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;
    toggleRoomStatus: (id: string) => Promise<void>;
    getRoomById: (roomId: string) => Promise<Room | undefined>;
    getRoomMembers: (roomId: string) => Promise<{
        data: {
            members: RoomMember[];
            meta?: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
        };
    }>;
    getRoomMembersOnly: (roomId: string) => Promise<{
        data: {
            members: RoomMember[];
            meta?: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
        };
    }>;
    getRestrictionStatus: (roomId: string, userId: string) => Promise<RestrictionStatus | null>;
}; 