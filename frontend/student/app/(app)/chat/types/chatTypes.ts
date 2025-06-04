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
  name: string;
  description: string;
  is_member: boolean;
  category?: string;
  members_count?: number;
  last_message?: string;
  last_message_time?: string;
  image_url?: string;
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