import { ChatRoom, RoomMember, User } from '../../types/chatTypes';

export interface RoomName {
  th_name: string;
  en_name: string;
}

export interface RoomsResponse {
  limit: number;
  page: number;
  rooms: ChatRoom[];
  total: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string | null;
  data: T;
}

export interface CreateRoomDto {
  name: {
    thName: string;
    enName: string;
  };
  capacity: number;
  image?: string;
  creatorId: string;
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
  image?: string;
}

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName?: string;
  type: 'message' | 'join' | 'leave';
  timestamp: string;
  isRead?: boolean;
}

export interface SendMessageDto {
  text: string;
  roomId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  message?: string;
  room?: ChatRoom;
}

export interface RoomMembersResponse {
  members: RoomMember[];
  room_id: string;
}

// Helper type for member mapping
export interface MemberLike {
  user_id?: string;
  id?: string;
  user?: User;
}

// Cache interfaces
export interface RoomCache {
  data: ChatRoom;
  timestamp: number;
}

export interface RoomListCache {
  data: ChatRoom[] | null;
  timestamp: number;
  CACHE_DURATION: number;
}

// WebSocket connection interface
export interface WebSocketConnection {
  socket: WebSocket;
  roomId: string;
  attempts: number;
}

// Backend room data interface
export interface BackendRoomData {
  _id: string;
  name?: {
    th?: string;
    en?: string;
  };
  description?: string;
  capacity: number;
  createdBy?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  is_member?: boolean;
  isMember?: boolean;
  memberCount?: number;
  members_count?: number;
  category?: string;
  last_message?: string;
  last_message_time?: string;
  image_url?: string;
  type?: string;
  status?: string;
  canJoin?: boolean;
  metadata?: any;
  members?: (string | MemberLike)[];
} 