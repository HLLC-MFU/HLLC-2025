import { Platform } from "react-native";
import { getToken } from "@/utils/storage";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:1334" : "http://localhost:1334";

const API_BASE_URL = `${BASE_URL}/api/v1`;

// Cache for room data
const roomCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for room list data
const roomListCache = {
  data: null as ChatRoom[] | null,
  timestamp: 0,
  CACHE_DURATION: 30 * 1000, // 30 seconds
};

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

export interface ChatRoom {
  id: string;
  created_at: string;
  updated_at: string;
  name: RoomName;
  capacity: number;
  image?: string;
  user_id: string;
  is_member: boolean;
  creator: string;
}

const getAuthHeaders = async () => {
  const token = await getToken("accessToken");
  console.log("Token from storage:", token);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  console.log("Auth headers:", headers);
  return headers;
};

export interface JoinRoomResponse {
  success: boolean;
  message?: string;
  room?: ChatRoom;
}

export const chatService = {
  async getRooms(): Promise<ChatRoom[]> {
    try {
      console.log('chatService.getRooms called');
      // Check cache first
      if (roomListCache.data && Date.now() - roomListCache.timestamp < roomListCache.CACHE_DURATION) {
        console.log('Using cached room list');
        return roomListCache.data;
      }

      console.time('fetchRooms');
      const headers = await getAuthHeaders();
      console.log('Making API request to:', `${API_BASE_URL}/rooms`);
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers,
      });

      if (!response.ok) {
        console.error('Failed to fetch rooms:', response.status, response.statusText);
        throw new Error("Failed to fetch rooms");
      }

      const result: RoomsResponse = await response.json();
      console.log('API Response:', result);
      console.timeEnd('fetchRooms');

      // Get user ID from token
      const token = await getToken("accessToken");
      if (!token) {
        console.error('No access token found');
        throw new Error("No access token found");
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || !payload.sub) {
        console.error('Invalid token payload:', payload);
        throw new Error("Invalid token payload");
      }

      const currentUserId = payload.sub;
      console.log('Current user ID:', currentUserId);

      // Get rooms with members
      console.time('fetchMembers');
      console.log('Fetching room members');
      const membersResponse = await fetch(`${API_BASE_URL}/rooms/with-members`, {
        headers,
      });

      let memberRooms: string[] = [];
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        memberRooms = membersData.rooms.map((r: any) => r.room.id);
        console.log('Member rooms:', memberRooms);
      } else {
        console.error('Failed to fetch member rooms:', membersResponse.status, membersResponse.statusText);
      }
      console.timeEnd('fetchMembers');

      // Process rooms
      console.time('processRooms');
      const enrichedRooms = result.rooms.map(room => ({
        ...room,
        is_member: memberRooms.includes(room.id),
      }));
      console.timeEnd('processRooms');
      console.log('Processed rooms:', enrichedRooms);

      // Update cache
      roomListCache.data = enrichedRooms;
      roomListCache.timestamp = Date.now();

      return enrichedRooms;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  },

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      // Check cache first
      const cached = roomCache.get(roomId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        headers
      });
      
      if (!response.ok) {
        return null;
      }
      
      const result = await response.json();
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }
      
      const userData = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = userData.sub; // Use sub instead of id

      // Check membership from members collection
      const membersResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
        headers
      });

      let isMember = false;
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        isMember = membersData.members?.includes(currentUserId) || false;
        console.log("isMember", isMember, "membersData", membersData, "currentUserId", currentUserId);
      }
      
      const roomData = {
        ...result,
        is_member: isMember
      };

      // Update cache
      roomCache.set(roomId, {
        data: roomData,
        timestamp: Date.now()
      });

      return roomData;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  },

  async checkRoomMembership(roomId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
      headers,
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

      // Get current user ID from token
      const token = await getToken("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const userData = JSON.parse(atob(token.split(".")[1]));
      const userId = userData.sub; // Use sub instead of id

      // First check if room is full
      const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        headers,
      });

      if (!roomResponse.ok) {
        throw new Error("Failed to get room information");
      }

      const roomData = await roomResponse.json();
      console.log("Room data:", roomData);

      // Check if room exists
      if (!roomData || !roomData.id) {
        throw new Error("Room not found");
      }

      // Check if user is already a member
      const membersResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
        headers,
      });

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        const isMember = membersData.members?.includes(userId) || false;
        
        if (isMember) {
          return {
            success: true,
            room: {
              ...roomData,
              is_member: true
            }
          };
        }
      }

      // Check if room is full
      const currentMembers = roomData.members || [];
      if (currentMembers.length >= roomData.capacity) {
        return {
          success: false,
          message: "Room is full",
        };
      }

      // Try to join the room
      const joinResponse = await fetch(
        `${API_BASE_URL}/rooms/${roomId}/${userId}/join`,
        {
          method: "POST",
          headers,
        }
      );

      if (!joinResponse.ok) {
        let errorMessage = "Failed to join room";
        const responseClone = joinResponse.clone();
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          const errorText = await joinResponse.text();
          errorMessage = errorText || errorMessage;
        }
        return {
          success: false,
          message: errorMessage,
        };
      }

      return {
        success: true,
        room: {
          ...roomData,
          is_member: true
        }
      };
    } catch (error) {
      console.error("Error joining room:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to join room",
      };
    }
  },

  async createRoom(data: CreateRoomDto): Promise<ChatRoom | null> {
    try {
      const token = await getToken("accessToken");
      if (!token) throw new Error("No access token found");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const userData = JSON.parse(atob(token.split(".")[1]));
      const creatorId = userData.sub; // Use sub instead of id

      const formData = new FormData();
      formData.append("name[th]", data.name.thName);
      formData.append("name[en]", data.name.enName);
      formData.append("capacity", data.capacity.toString());
      formData.append("creator_id", creatorId);
      
      if (data.image) {
        formData.append("image", {
          uri: data.image,
          type: 'image/jpeg',
          name: 'room-image.jpg'
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  },

  updateRoom: async (
    roomId: string,
    data: UpdateRoomDto
  ): Promise<ChatRoom | null> => {
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.image) formData.append("image", data.image);

      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result: ApiResponse<ChatRoom> = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to update room");

      return result.data;
    } catch (error) {
      console.error("Error updating room:", error);
      return null;
    }
  },

  deleteRoom: async (roomId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Failed to delete room"
        );
      return true;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  },

  leaveRoom: async (roomId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: "POST",
        headers,
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Failed to leave room"
        );
      return true;
    } catch (error) {
      console.error("Error leaving room:", error);
      return false;
    }
  },

  async getMyRooms(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch my rooms");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching my rooms:", error);
      return [];
    }
  },

  async getDiscoverRooms(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch discover rooms");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching discover rooms:", error);
      return [];
    }
  },

  async sendMessage(data: SendMessageDto): Promise<ChatMessage | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${data.roomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: data.text }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  async markMessageAsRead(roomId: string, messageId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages/${messageId}/read`, {
        method: 'POST',
        headers,
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  },

  async getRoomsWithMembers(): Promise<{ rooms: { room: ChatRoom, members: string[] }[] }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/with-members`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms with members');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching rooms with members:', error);
      return { rooms: [] };
    }
  },
};
