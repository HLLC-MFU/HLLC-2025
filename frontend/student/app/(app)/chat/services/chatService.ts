import { Platform } from 'react-native';
import { ChatRoom } from '../types/chatTypes';
import { getToken } from '@/utils/storage';

const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:1334'
  : 'http://localhost:1334';

const API_BASE_URL = `${BASE_URL}/api/v1`;

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
  name: RoomName;
  capacity: number;
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

const getAuthHeaders = async () => {
  const token = await getToken('accessToken');
  console.log('Token from storage:', token);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  console.log('Auth headers:', headers);
  return headers;
};

export interface ChatRoom {
  _id: string;
  created_at: string;
  updated_at: string;
  name: RoomName;
  capacity: number;
  image?: string;
  members?: string[];
  is_member?: boolean;
}

export interface JoinRoomResponse {
  success: boolean;
  message?: string;
  room?: ChatRoom;
}

export const chatService = {
  async getRooms(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const result: RoomsResponse = await response.json();
      console.log('API Response:', result);
      
      // Get current user ID from token
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }
      
      const userData = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = userData.id;

      // Mark rooms where user is a member
      return result.rooms.map(room => ({
        ...room,
        is_member: room.members?.includes(currentUserId) || false
      }));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      headers
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  },

  async checkRoomMembership(roomId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
      headers
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isMember;
  },

  async joinRoom(roomId: string): Promise<JoinRoomResponse> {
    try {
      const headers = await getAuthHeaders();
      
      // First check if room is full
      const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        headers
      });
      
      if (!roomResponse.ok) {
        throw new Error('Failed to get room information');
      }
      
      const roomData = await roomResponse.json();
      const room = roomData.data;
      
      // Check if room is full
      if (room.members && room.members.length >= room.capacity) {
        return {
          success: false,
          message: 'Room is full'
        };
      }

      // Try to join the room
      const joinResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/join`, {
        method: 'POST',
        headers
      });
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        return {
          success: false,
          message: errorData.message || 'Failed to join room'
        };
      }

      // Get updated room data after joining
      const updatedRoomResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        headers
      });
      
      if (!updatedRoomResponse.ok) {
        throw new Error('Failed to get updated room information');
      }

      const updatedRoomData = await updatedRoomResponse.json();
      
      return {
        success: true,
        room: updatedRoomData.data
      };
    } catch (error) {
      console.error('Error joining room:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to join room'
      };
    }
  },

  async createRoom(data: CreateRoomDto): Promise<ChatRoom | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  },

  updateRoom: async (roomId: string, data: UpdateRoomDto): Promise<ChatRoom | null> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ChatRoom> = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update room');

      return result.data;
    } catch (error) {
      console.error('Error updating room:', error);
      return null;
    }
  },

  deleteRoom: async (roomId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, { 
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete room');
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  },

  sendMessage: async (roomId: string, message: string): Promise<ChatMessage | null> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      const result: ApiResponse<ChatMessage> = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to send message');

      return result.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  leaveRoom: async (roomId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, { 
        method: 'POST',
        headers
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to leave room');
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      return false;
    }
  },

  getRoomMessages: async (roomId: string): Promise<ChatMessage[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
        headers
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch messages');
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async getMyRooms(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch my rooms');
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching my rooms:', error);
      return [];
    }
  },

  async getDiscoverRooms(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch discover rooms');
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching discover rooms:', error);
      return [];
    }
  },
};
export { ChatRoom };

