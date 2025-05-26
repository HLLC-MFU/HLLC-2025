export interface Message {
  id?: string;
  text?: string;
  senderId: string;
  senderName: string;
  type: 'message' | 'join' | 'leave' | 'file' | 'sticker' | 'mention';
  timestamp: string;
  isRead: boolean;
  reactions?: Array<{
    userId: string;
    reaction: string;
  }>;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
  };
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  stickerId?: string;
  image?: string;
  mentioned?: string;
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
    th_name: string;
    en_name: string;
  };
  capacity: number;
  image?: string;
  is_member: boolean;
  creator: string;
  created_at: string;
  updated_at: string;
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