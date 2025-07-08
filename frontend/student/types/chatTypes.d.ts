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
    claimUrl: string;
    description: string;
    title: string;
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

interface UserName {
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

export default {}; 