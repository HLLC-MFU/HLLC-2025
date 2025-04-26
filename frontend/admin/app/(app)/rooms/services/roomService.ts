import { LocalizedName } from "@/types/common";


export interface Room {
  id: string;
  name: LocalizedName;
  capacity: number;
}

export interface CreateRoomDto {
  name: {
    thName: string;
    enName: string;
  };
  capacity: number;
}

export interface UpdateRoomDto extends CreateRoomDto {}

export interface RoomsResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1334';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const roomService = {
  // Get all rooms
  getRooms: async (page: number = 1, limit: number = 10): Promise<RoomsResponse> => {
    try {
      const response = await fetch(`http://localhost:1334/api/v1/public/rooms/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { rooms: [], total: 0, page: 1, limit: 10 };
    }
  },

  // Get a specific room
  getRoom: async (id: string): Promise<Room | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/rooms/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch room');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  },

  // Create a new room
  createRoom: async (data: CreateRoomDto): Promise<Room | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  },

  // Update a room
  updateRoom: async (id: string, data: UpdateRoomDto): Promise<Room | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/rooms/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update room');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating room:', error);
      return null;
    }
  },

  // Delete a room
  deleteRoom: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/rooms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  },

  // Kick user from room
  kickUser: async (roomId: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/admin/rooms/${roomId}/kick/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error kicking user:', error);
      return false;
    }
  },
}; 