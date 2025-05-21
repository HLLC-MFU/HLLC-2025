export interface Message {
  id?: string;
  type: 'message' | 'join' | 'leave';
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface ConnectedUser {
  id: string;
  name: string;
  online: boolean;
}

export interface RoomName {
  th_name: string;
  en_name: string;
}

export interface ChatRoom {
  id: string;
  created_at: string;
  updated_at: string;
  name: RoomName;
  capacity: number;
  image?: string;
  members?: string[];
  is_member?: boolean;
}

export interface RoomsResponse {
  limit: number;
  page: number;
  rooms: ChatRoom[];
  total: number;
}

export interface User {
  id: string;
  username: string;
  token: string;
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