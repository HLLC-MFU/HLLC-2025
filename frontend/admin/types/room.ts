// Types
export type Name = { en: string; th: string; };
export type RoomType = "normal" | "readonly";

// RoomSchedule สำหรับการตั้งเวลาเปิดปิดห้อง
export type RoomSchedule = {
    startAt?: string; // ISO string
    endAt?: string;   // ISO string
};

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
    statusCode?: number;
};

export type RoomByIdResponse = {
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
    metadata?: Record<string, any>;
    canJoin?: boolean;
    isMember?: boolean;
    schedule?: RoomSchedule; // เพิ่มฟิลด์ schedule
};

export type RoomsByTypeResponse = {
    data: RoomByIdResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type UseRoomsByTypeReturn = {
    roomsByType: Record<string, RoomsByTypeResponse>;
    loading: Record<string, boolean>;
    error: Record<string, string | null>;
    fetchRoomsByType: (roomType: string, page?: number, limit?: number) => Promise<void>;
    loadMoreRooms: (roomType: string) => Promise<void>;
    refreshRooms: (roomType: string) => Promise<void>;
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

export type RoomListResponse = {
    data: RoomByIdResponse[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
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

export type UseChatReturn = {
    room: RoomByIdResponse[];
    loading: boolean;
    error: string | null;
    fetchRoom: () => Promise<void>;
    createRoom: (roomData: FormData) => Promise<void>;
    updateRoom: (id: string, roomData: FormData) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;
    getRoomById: (roomId: string) => Promise<RoomByIdResponse | undefined>;
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
    getRestrictionStatus: (roomId: string, userId: string) => Promise<RestrictionStatus | null>;
}; 