import { apiRequest } from '@/utils/api';

export interface RoomName {
  en_name: string;
  th_name: string;
}

export interface ChatRoom {
  id: string;
  name: RoomName;
  capacity: number;
  connected_users: number;
  created_at: string;
  updated_at: string;
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
  name: string;
  description: string;
  image?: string;
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
  image?: string;
}

export interface ChatMessage {
  user_id: string;
  text: string;
  timestamp: string;
}

export const chatService = {
  // Get all chat rooms (public)
  getRooms: async (): Promise<ChatRoom[]> => {
    try {
      const response = await fetch('http://localhost:1334/api/v1/public/rooms');
      const result: RoomsResponse = await response.json();
      console.log('API Response:', result);
      
      if (!result.rooms) {
        return [];
      }
      
      return result.rooms;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  // Get a specific room (public)
  getRoom: async (roomId: string): Promise<ChatRoom | null> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/public/rooms/${roomId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch room');
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  },

  // Create a new room (protected)
  createRoom: async (data: CreateRoomDto): Promise<ChatRoom | null> => {
    try {
      const response = await fetch('http://localhost:1334/api/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<ChatRoom> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create room');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  },

  // Update a room (admin only)
  updateRoom: async (roomId: string, data: UpdateRoomDto): Promise<ChatRoom | null> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<ChatRoom> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update room');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error updating room:', error);
      return null;
    }
  },

  // Delete a room (protected/admin)
  deleteRoom: async (roomId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete room');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  },


  // Send a new message
  sendMessage: async (roomId: string, message: string): Promise<ChatMessage | null> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const result: ApiResponse<ChatMessage> = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  // Join a chat room
  joinRoom: async (roomId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}/join`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to join room');
      }
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  },

  // Leave a chat room
  leaveRoom: async (roomId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}/leave`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to leave room');
      }
      
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      return false;
    }
  },

  // Get chat history for a room
  getRoomMessages: async (roomId: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/rooms/${roomId}/messages`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch messages');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },
}; 