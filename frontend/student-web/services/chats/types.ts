import { ChatRoom, RoomMember, Message, User, BackendRoomData } from '@/types/chat';

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

export interface MemberLike {
  user_id?: string;
  id?: string;
  user?: User;
}

export interface RoomCache {
  data: ChatRoom;
  timestamp: number;
}

export interface RoomListCache {
  data: ChatRoom[] | null;
  timestamp: number;
  CACHE_DURATION: number;
}

export interface WebSocketConnection {
  socket: WebSocket;
  roomId: string;
  attempts: number;
}

export interface ExtendedChatRoom extends ChatRoom {
  members?: (string | MemberLike)[];
} 