import { getToken } from '@/utils/storage';
import { ChatRoom, MembersResponse } from '../../types/chatTypes';
import {
  CHAT_BASE_URL,
  WS_BASE_URL,
  API_BASE_URL,
} from '../../configs/chats/chatConfig';
import type { RoomMember, User } from '@/types/chatTypes';
import { Buffer } from 'buffer';

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

interface RoomMembersResponse {
  members: RoomMember[];
  room_id: string;
}

// Helper type for member mapping
interface MemberLike {
  user_id?: string;
  id?: string;
  user?: User;
}

async function getAuthHeaders() {
  const token = await getToken('accessToken');

  if (!token) throw new Error('No access token found');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return headers;
}

class ChatService {
  async getRooms(): Promise<ChatRoom[]> {
    try {
      // Check cache first
      if (
        roomListCache.data &&
        Date.now() - roomListCache.timestamp < roomListCache.CACHE_DURATION
      ) {
        return roomListCache.data;
      }

      const headers = await getAuthHeaders();
      // Try multiple endpoints
      const endpoints = [`${API_BASE_URL}/rooms`];
      let response: Response | null = null;
      let lastError: string = '';
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, { headers });
          if (response.ok) {
            break;
          } else {
            const errorText = await response.text();
            lastError = `Endpoint ${endpoint} failed: ${response.status} - ${errorText}`;
            console.error(lastError);
          }
        } catch (error) {
          lastError = `Endpoint ${endpoint} error: ${error}`;
          console.error(lastError);
        }
      }
      if (!response || !response.ok) {
        console.error('All endpoints failed. Last error:', lastError);
        throw new Error('Failed to fetch rooms from all endpoints');
      }
      const result = await response.json();
      // Map backend fields to ChatRoom type (no /with-members)
      const rooms = (
        Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.rooms)
          ? result.rooms
          : []
      ).map((room: any) => ({
        id: room._id,
        name: {
          th: room.name?.th || '',
          en: room.name?.en || '',
        },
        description: room.description,
        capacity: room.capacity,
        creator_id: room.createdBy,
        image: room.image,
        created_at: room.createdAt,
        updated_at: room.updatedAt,
        is_member: room.isMember ?? false,
        type: room.type && room.type !== 'undefined' ? room.type : 'normal',
        status: room.status && room.status !== 'undefined' ? room.status : 'active',

        category: room.category,
        members_count:
          room.memberCount ||
          (Array.isArray(room.members) ? room.members.length : 0),
        last_message: room.last_message,
        last_message_time: room.last_message_time,
        image_url: room.image_url,
        members: room.members,
      }));

      // Update cache
      roomListCache.data = rooms;
      roomListCache.timestamp = Date.now();
      return rooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      if (roomListCache.data) {
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
        headers,
      });
      if (!response.ok) {
        return null;
      }
      const result = await response.json();

      // Map backend fields to ChatRoom type
      const room = result.data ? result.data : result;
      const mappedRoom: ChatRoom = {
        id: room._id,
        name: {
          th: room.name?.th || '',
          en: room.name?.en || '',
        },
        description: room.description,
        capacity: room.capacity,
        creator_id: room.createdBy,
        image: room.image,
        created_at: room.createdAt,
        updated_at: room.updatedAt,
        is_member:
          room.is_member !== undefined
            ? room.is_member
            : room.isMember !== undefined
            ? room.isMember
            : false,
        members_count: room.memberCount || room.members_count || 0,
        category: room.category,
        last_message: room.last_message,
        last_message_time: room.last_message_time,
        image_url: room.image_url,
        type: room.type && room.type !== 'undefined' ? room.type : 'normal',
        status: room.status && room.status !== 'undefined' ? room.status : 'active',
        canJoin: room.canJoin ?? true,
        metadata: room.metadata ?? null,
      };

      // Update cache
      roomCache.set(roomId, {
        data: mappedRoom,
        timestamp: Date.now(),
      });
      return mappedRoom;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  async checkRoomMembership(roomId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
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
      const token = await getToken('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const userData = JSON.parse(
        Buffer.from(base64, 'base64').toString('utf8'),
      );
      const userId = userData.sub; // Use sub instead of id

      // First check if room is full
      const roomResponse = await fetch(`${CHAT_BASE_URL}/api/rooms/${roomId}`, {
        headers,
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to get room information');
      }

      const roomResponseJson = await roomResponse.json();
      const roomData = roomResponseJson.data || roomResponseJson; // รองรับทั้งสองแบบ

      // Check if room exists
      if (!roomData || !(roomData._id || roomData.id)) {
        throw new Error('Room not found');
      }

      // Check if user is already a member
      const membersResponse = await fetch(
        `${CHAT_BASE_URL}/api/rooms/${roomId}`,
        {
          headers,
        },
      );

      if (membersResponse.ok) {
        const membersResponseJson = await membersResponse.json();
        const membersData = membersResponseJson.data || membersResponseJson;

        // Handle different response formats
        let isMember = false;
        if (membersData.members) {
          if (Array.isArray(membersData.members)) {
            const memberIds = membersData.members.map(
              (member: string | MemberLike) =>
                typeof member === 'string'
                  ? member
                  : member.user_id || member.id,
            );
            isMember = memberIds.includes(userId);
          } else {
            isMember = Boolean(membersData.members);
          }
        } else if (membersData.isMember !== undefined) {
          isMember = membersData.isMember;
        }

        if (isMember) {
          return {
            success: true,
            room: {
              id: roomData._id,
              name: roomData.name,
              description: roomData.description,
              capacity: roomData.capacity,
              creator_id: roomData.createdBy,
              image: roomData.image,
              created_at: roomData.createdAt,
              updated_at: roomData.updatedAt,
              is_member: true,
              category: roomData.category,
              members_count:
                roomData.memberCount ||
                (Array.isArray(roomData.members) ? roomData.members.length : 0),
              last_message: roomData.last_message,
              last_message_time: roomData.last_message_time,
              image_url: roomData.image_url,
            },
          };
        }
      }

      // Check if room is full
      const currentMembers = roomData.members || [];
      if (currentMembers.length >= roomData.capacity) {
        return {
          success: false,
          message: 'Room is full',
        };
      }

      // Try to join the room
      const joinResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/join`, {
        method: 'POST',
        headers,
      });

      if (!joinResponse.ok) {
        let errorMessage = 'Failed to join room';
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
          id: roomData._id,
          name: roomData.name,
          description: roomData.description,
          capacity: roomData.capacity,
          creator_id: roomData.createdBy,
          image: roomData.image,
          created_at: roomData.createdAt,
          updated_at: roomData.updatedAt,
          is_member: true,
          category: roomData.category,
          members_count:
            roomData.memberCount ||
            (Array.isArray(roomData.members) ? roomData.members.length : 0),
          last_message: roomData.last_message,
          last_message_time: roomData.last_message_time,
          image_url: roomData.image_url,
        },
      };
    } catch (error) {
      console.error('Error joining room:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to join room',
      };
    }
  }

  async createRoom(data: CreateRoomDto): Promise<ChatRoom | null> {
    try {
      const token = await getToken('accessToken');
      if (!token) throw new Error('No access token found');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const userData = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
      );
      const creatorId = userData.sub; // Use sub instead of id

      const formData = new FormData();
      formData.append('name[th]', data.name.thName);
      formData.append('name[en]', data.name.enName);
      formData.append('capacity', data.capacity.toString());
      formData.append('createdBy', creatorId);
      formData.append('type', 'normal');
      formData.append('status', 'active');

      if (data.image) {
        const imageFile = {
          uri: data.image,
          type: 'image/jpeg',
          name: 'room-image.jpg',
        };
        formData.append('image', imageFile as unknown as Blob);
      }

      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }

  async updateRoom(
    roomId: string,
    data: UpdateRoomDto,
  ): Promise<ChatRoom | null> {
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.image) formData.append('image', data.image);

      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result: ApiResponse<ChatRoom> = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Failed to update room');

      return result.data;
    } catch (error) {
      console.error('Error updating room:', error);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).message || 'Failed to delete room',
        );
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  async leaveRoom(roomId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers,
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).message || 'Failed to leave room',
        );
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
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
        throw new Error('Failed to fetch my rooms');
      }

      const result = await response.json();

      // Map backend fields to ChatRoom type
      const rooms = (Array.isArray(result.data) ? result.data : []).map(
        (room: any) => ({
          id: room._id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          creator_id: room.createdBy,
          image: room.image,
          created_at: room.createdAt,
          updated_at: room.updatedAt,
          is_member: room.isMember || true, // ถ้าเป็น my rooms แสดงว่าเป็น member แล้ว
          category: room.category,
          members_count:
            room.memberCount ||
            (Array.isArray(room.members) ? room.members.length : 0),
          last_message: room.last_message,
          last_message_time: room.last_message_time,
          image_url: room.image_url,
          type: room.type && room.type !== 'undefined' ? room.type : 'normal',
          status: room.status && room.status !== 'undefined' ? room.status : 'active',
          members: room.members,
        }),
      );

      return rooms;
    } catch (error) {
      console.error('Error fetching my rooms:', error);
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
        throw new Error('Failed to fetch discover rooms');
      }

      const result = await response.json();

      // Map backend fields to ChatRoom type
      const rooms = (Array.isArray(result.data) ? result.data : []).map(
        (room: any) => ({
          id: room._id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          creator_id: room.createdBy,
          image: room.image,
          created_at: room.createdAt,
          updated_at: room.updatedAt,
          is_member: room.isMember || false,
          category: room.category,
          members_count:
            room.memberCount ||
            (Array.isArray(room.members) ? room.members.length : 0),
          last_message: room.last_message,
          last_message_time: room.last_message_time,
          image_url: room.image_url,
          type: room.type && room.type !== 'undefined' ? room.type : 'normal',
          status: room.status && room.status !== 'undefined' ? room.status : 'active',
          members: room.members,
        }),
      );

      return rooms;
    } catch (error) {
      console.error('Error fetching discover rooms:', error);
      return [];
    }
  }

  async sendMessage(data: SendMessageDto): Promise<ChatMessage | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/rooms/${data.roomId}/messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: data.text }),
        },
      );

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
      const response = await fetch(
        `${API_BASE_URL}/rooms/${roomId}/messages/${messageId}/read`,
        {
          method: 'POST',
          headers,
        },
      );

      return response.ok;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async getRoomsWithMembers(): Promise<{
    rooms: { room: ChatRoom; members: string[] }[];
  }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${CHAT_BASE_URL}/api/rooms/with-members`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms with members');
      }

      const result = await response.json();

      // Transform the response to match expected format
      const transformedRooms =
        result.rooms?.map(
          (item: { room: ChatRoom; members: (string | MemberLike)[] }) => {
            const members = item.members || [];
            // Extract user IDs from member objects
            const memberIds = members.map((member: string | MemberLike) =>
              typeof member === 'string' ? member : member.user_id || member.id,
            );
            return {
              room: item.room,
              members: memberIds,
            };
          },
        ) || [];

      return { rooms: transformedRooms };
    } catch (error) {
      console.error('Error fetching rooms with members:', error);
      return { rooms: [] };
    }
  }

  async getRoomMembers(roomId: string): Promise<RoomMembersResponse | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room members');
      }

      const result = await response.json();

      // Map ให้ user มี _id เสมอ
      if (result.members && Array.isArray(result.members)) {
        result.members = result.members.map((member: RoomMember) => ({
          ...member,
          user: {
            ...member.user,
            _id: member.user._id, // Use only _id as per User interface
          },
        }));
      }

      return result;
    } catch (error) {
      console.error('Error fetching room members:', error);
      return null;
    }
  }

  // เพิ่ม method สำหรับดึงรายชื่อสมาชิกแบบ paginated
  async getRoomMembersPaginated(
    roomId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MembersResponse | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/rooms/${roomId}/members?page=${page}&limit=${limit}`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch room members');
      }

      const result = await response.json();

      // Handle the actual API response format
      if (result.success && result.data && result.data.members) {
        const members = result.data.members.map((member: any) => ({
          user_id: member.user._id,
          user: {
            _id: member.user._id,
            name: member.user.name || { first: '', middle: '', last: '' },
            username: member.user.username || '',
            profile_image_url: member.user.profile_image_url,
          },
        }));

        return {
          members: members,
          total: members.length,
          page: page,
          limit: limit,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching room members:', error);
      return null;
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async connectToWebSocket(roomId: string, userId: string): Promise<WebSocket> {
    // Check if we already have a connection
    const existingConnection = wsConnections.get(roomId);
    if (
      existingConnection &&
      existingConnection.readyState === WebSocket.OPEN
    ) {
      return existingConnection;
    }

    // Close existing connection if it exists but is not open
    if (existingConnection) {
      existingConnection.close();
      wsConnections.delete(roomId);
    }

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < MAX_RECONNECT_ATTEMPTS) {
      try {
        // ดึง token
        const token = await getToken('accessToken');
        // ต่อ WebSocket พร้อมแนบ token ใน query string
        const wsUrl = `${WS_BASE_URL}/chat/ws/${roomId}?token=${token}`;

        const ws = await new Promise<WebSocket>((resolve, reject) => {
          const socket = new WebSocket(wsUrl);

          socket.onopen = () => {
            wsConnections.set(roomId, socket);
            resolve(socket);
          };

          socket.onerror = error => {
            console.error('WebSocket connection error:', error);
            reject(error);
          };

          socket.onclose = () => {
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
          await this.wait(RECONNECT_DELAY);
        }
      }
    }

    throw lastError || new Error('Failed to connect after maximum attempts');
  }

  async disconnectWebSocket(roomId: string) {
    const ws = wsConnections.get(roomId);
    if (ws) {
      ws.close();
      wsConnections.delete(roomId);
    }
  }

  // ดึงห้องทั้งหมดที่ user มองเห็น (discover)
  async getAllRoomsForUser(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/all-for-user`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch all rooms for user');
      const result = await response.json();

      // Map backend fields to ChatRoom type
      const rooms = (Array.isArray(result.data) ? result.data : []).map(
        (room: any) => ({
          id: room._id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          creator_id: room.createdBy,
          image: room.image,
          created_at: room.createdAt,
          updated_at: room.updatedAt,
          is_member: room.isMember || false,
          category: room.category,
          members_count:
            room.memberCount ||
            (Array.isArray(room.members) ? room.members.length : 0),
          last_message: room.last_message,
          last_message_time: room.last_message_time,
          image_url: room.image_url,
          type: room.type && room.type !== 'undefined' ? room.type : 'normal',
          status: room.status && room.status !== 'undefined' ? room.status : 'active',
          members: room.members,
        }),
      );

      return rooms;
    } catch (error) {
      console.error('Error fetching all rooms for user:', error);
      return [];
    }
  }

  // ดึงเฉพาะห้องของฉัน (my rooms)
  async getMyRoomsByApi(): Promise<ChatRoom[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/rooms/me`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch my rooms');
      const result = await response.json();

      // Map backend fields to ChatRoom type
      const rooms = (Array.isArray(result.data) ? result.data : []).map(
        (room: any) => ({
          id: room._id,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          creator_id: room.createdBy,
          image: room.image,
          created_at: room.createdAt,
          updated_at: room.updatedAt,
          is_member: room.isMember || true, // ถ้าเป็น my rooms แสดงว่าเป็น member แล้ว
          category: room.category,
          members_count:
            room.memberCount ||
            (Array.isArray(room.members) ? room.members.length : 0),
          last_message: room.last_message,
          last_message_time: room.last_message_time,
          image_url: room.image_url,
          type: room.type && room.type !== 'undefined' ? room.type : 'normal',
          status: room.status && room.status !== 'undefined' ? room.status : 'active',
          members: room.members,
        }),
      );

      return rooms;
    } catch (error) {
      console.error('Error fetching my rooms:', error);
      return [];
    }
  }
}

export default new ChatService();
