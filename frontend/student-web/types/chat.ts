// Chat types migrated from expo's chatTypes.d.ts

export interface Message {
  id?: string;
  text?: string;
  user?: User;
  type: 'message' | 'join' | 'leave' | 'file' | 'sticker' | 'mention' | 'evoucher';
  timestamp: string;
  isRead: boolean;
  isTemp?: boolean;
  reactions?: Array<{
    userId: string;
    reaction: string;
  }>;
  replyTo?: {
    id: string;
    text: string;
    user?: User;
    type?: 'message' | 'join' | 'leave' | 'file' | 'sticker' | 'mention';
    image?: string;
    fileName?: string;
    fileType?: string;
    stickerId?: string;
    notFound?: boolean;
  };
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  stickerId?: string;
  image?: string;
  mentioned?: string;
  mentions?: string[];
  username?: string;
  evoucherInfo?: {
    message: {
      th: string;
      en: string;
    };
    claimUrl: string;
    sponsorImage?: string;
  };
  // Add payload field for WebSocket messages that contain additional data
  payload?: {
    evoucherInfo?: {
      message: {
        th: string;
        en: string;
      };
      claimUrl: string;
      sponsorImage?: string;
      claimedBy?: string | null;
    };
    [key: string]: any;
  };
}

export interface ConnectedUser {
  id: string;
  name?: string;
  online: boolean;
}

export interface RoomName {
  th_name: string;
  en_name: string;
}

export interface ChatRoom {
  id: string;
  name: {
    th: string;
    en: string;
  };
  description?: string;
  capacity: number;
  creator_id: string;
  creator?: {
    id: string;
    name: {
      first: string;
      middle?: string;
      last: string;
    };
    username: string;
    role: string;
    metadata?: {
      major: string;
      secret: string;
    };
    created_at: string;
    updated_at: string;
  };
  image?: string;
  created_at: string;
  updated_at: string;
  is_member: boolean;
  members_count: number;
  category?: string;
  last_message?: string;
  last_message_time?: string;
  image_url?: string;
  type?: string; // normal, readonly, etc.
  status?: string; 
  canJoin?: boolean;
  metadata?: any;
}

export interface RoomsResponse {
  limit: number;
  page: number;
  rooms: ChatRoom[];
  total: number;
}

export interface UserName {
  first: string;
  middle: string;
  last: string;
}

export interface User {
  _id: string;
  name: UserName;
  username: string;
  profile_image_url?: string;
}

export interface RoomMember {
  user_id: string;
  user: User;
}

export interface AvatarProps {
  name: string;
  online?: boolean;
  size?: number;
}

export interface SystemMessageProps {
  text: string;
  timestamp?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  senderId: string;
  senderName?: string;
  isRead?: boolean;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  onReply?: (message: Message) => void;
}

export interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export interface JoinBannerProps {
  onJoin: () => void;
  joining: boolean;
  roomCapacity: number;
  connectedCount: number;
}

export interface RoomInfoModalProps {
  room: ChatRoom;
  isVisible: boolean;
  onClose: () => void;
  connectedUsers: ConnectedUser[];
}

export interface MembersResponse {
  members: RoomMember[];
  total: number;
  page: number;
  limit: number;
}

export interface RoomName {
  th_name: string;
  en_name: string;
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