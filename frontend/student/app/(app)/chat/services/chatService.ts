import { Platform } from "react-native";
import { getToken } from "@/utils/storage";
import { ChatRoom } from '../types/chatTypes';

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:1334" : "http://localhost:1334";

const WS_BASE_URL = Platform.OS === "android" ? "ws://10.0.2.2:1334" : "ws://localhost:1334";

const API_BASE_URL = `${BASE_URL}/api/v1`;

// Cache for room data
const roomCache = new Map<string, { data: ChatRoom; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for room list data
const roomListCache = {
  data: null as ChatRoom[] | null,
  timestamp: 0,
  CACHE_DURATION: 30 * 1000, // 30 seconds
};

// WebSocket connection cache
const wsConnections = new Map<string, WebSocket>();
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

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

async function getAuthHeaders() {
  const token = await getToken("accessToken");
  if (!token) throw new Error("No access token found");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

class ChatService {
  async getRooms(): Promise<ChatRoom[]> {
    try {
      // Check cache first
      if (roomListCache.data && Date.now() - roomListCache.timestamp < roomListCache.CACHE_DURATION) {
        console.log('Returning cached rooms:', roomListCache.data);
        return roomListCache.data;
      }

      const headers = await getAuthHeaders();
      console.log('Fetching rooms with headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers,
      });

      if (!response.ok) {
        console.error('Failed to fetch rooms:', response.status, response.statusText);
        throw new Error("Failed to fetch rooms");
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Handle both response formats
      const rooms = Array.isArray(result) ? result : (result.rooms || []);
      console.log('Parsed rooms:', rooms);

      // Get current user ID from token
      const token = await getToken("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const userData = JSON.parse(atob(token.split(".")[1]));
      const currentUserId = userData.sub;
      console.log('Current user ID:', currentUserId);

      // Get rooms with members
      const roomsWithMembers = await this.getRoomsWithMembers();
      console.log('Rooms with members:', roomsWithMembers);
      
      const membersMap = new Map(
        roomsWithMembers.rooms.map(({ room, members }) => [room.id, members])
      );

      // Enrich room data with membership info
      const enrichedRooms = rooms.map((room: ChatRoom) => {
        const members = membersMap.get(room.id) || [];
        const enrichedRoom = {
          ...room,
          is_member: members.includes(currentUserId),
          members_count: members.length
        };
        console.log('Enriched room:', enrichedRoom);
        return enrichedRoom;
      });

      // Update cache
      roomListCache.data = enrichedRooms;
      roomListCache.timestamp = Date.now();
      console.log('Updated cache with rooms:', enrichedRooms);

      return enrichedRooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      // If there's an error, try to return cached data if available
      if (roomListCache.data) {
        console.log('Returning cached data due to error');
        return roomListCache.data;
      }
      throw error;
    }
  }

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
  }

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
  }

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
  }

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
        const imageFile = {
          uri: data.image,
          type: 'image/jpeg',
          name: 'room-image.jpg'
        };
        formData.append("image", imageFile as unknown as Blob);
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
  }

  async updateRoom(roomId: string, data: UpdateRoomDto): Promise<ChatRoom | null> {
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
  }

  async deleteRoom(roomId: string): Promise<boolean> {
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
  }

  async leaveRoom(roomId: string): Promise<boolean> {
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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async connectToWebSocket(roomId: string, userId: string): Promise<WebSocket> {
    // Check if we already have a connection
    const existingConnection = wsConnections.get(roomId);
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      console.log('Using existing WebSocket connection');
      return existingConnection;
    }

    // Close existing connection if it exists but is not open
    if (existingConnection) {
      console.log('Closing existing connection');
      existingConnection.close();
      wsConnections.delete(roomId);
    }

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < MAX_RECONNECT_ATTEMPTS) {
      try {
        const wsUrl = `${WS_BASE_URL}/ws/${roomId}/${userId}`;
        console.log(`Connecting to WebSocket (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}):`, wsUrl);
        
        const ws = await new Promise<WebSocket>((resolve, reject) => {
          const socket = new WebSocket(wsUrl);
          
          socket.onopen = () => {
            console.log('WebSocket connected successfully');
            wsConnections.set(roomId, socket);
            resolve(socket);
          };
          
          socket.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            reject(error);
          };

          socket.onclose = () => {
            console.log('WebSocket connection closed');
            wsConnections.delete(roomId);
          };
          
          // Set a timeout for the connection
          setTimeout(() => {
            if (socket.readyState !== WebSocket.OPEN) {
              socket.close();
              reject(new Error('Connection timeout'));
            }
          }, 5000);
        });

        return ws;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;
        
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Reconnect attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS}`);
          await this.wait(RECONNECT_DELAY);
        }
      }
    }

    throw lastError || new Error('Failed to connect after maximum attempts');
  }

  async disconnectWebSocket(roomId: string) {
    const ws = wsConnections.get(roomId);
    if (ws) {
      console.log('Disconnecting WebSocket');
      ws.close();
      wsConnections.delete(roomId);
    }
  }
}

export const chatService = new ChatService();
