import { ChatRoom, MembersResponse, RoomMember } from '@/types/chat';
import { 
  CreateRoomDto, 
  UpdateRoomDto, 
  SendMessageDto, 
  JoinRoomResponse, 
  RoomMembersResponse,
  ChatMessage,
  ApiResponse 
} from './types';
import { ApiClient } from './apiClient';
import { RoomMapper } from './roomMapper';
import { WebSocketManager } from './webSocketManager';
import { CacheManager } from './cacheManager';

class ChatService {
  // Room Management
  async getRooms(): Promise<ChatRoom[]> {
    try {
      // Check cache first
      const cached = CacheManager.getRoomList();
      if (cached) {
        return cached;
      }

      // Try multiple endpoints
      const endpoints = [ApiClient.getRoomsEndpoint()];
      let response: any = null;
      let lastError: string = '';

      for (const endpoint of endpoints) {
        try {
          response = await ApiClient.get<any>(endpoint);
          break;
        } catch (error) {
          lastError = `Endpoint ${endpoint} failed: ${error}`;
          console.error(lastError);
        }
      }

      if (!response) {
        console.error('All endpoints failed. Last error:', lastError);
        throw new Error('Failed to fetch rooms from all endpoints');
      }

      const rooms = RoomMapper.mapRoomsResponse(response);
      
      // Update cache
      CacheManager.setRoomList(rooms);
      return rooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      const cached = CacheManager.getRoomList();
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      // Check cache first
      const cached = CacheManager.getRoom(roomId);
      if (cached) {
        return cached;
      }

      // Use the correct chat API endpoint that returns full room data
      const response = await ApiClient.get<any>(ApiClient.getChatRoomEndpoint(roomId));

      
      const room = response.data ? response.data : response;
      
      
      const mappedRoom = RoomMapper.mapRoomData(room);
      

      // Update cache
      CacheManager.setRoom(roomId, mappedRoom);
      return mappedRoom;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  async checkRoomMembership(roomId: string): Promise<boolean> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getRoomEndpoint(roomId));
      return response.isMember;
    } catch (error) {
      console.error('Error checking room membership:', error);
      return false;
    }
  }

  async joinRoom(roomId: string): Promise<JoinRoomResponse> {
    try {
      const userId = await ApiClient.getUserId();

      // First check if room is full
      const roomResponse = await ApiClient.get<any>(ApiClient.getChatRoomEndpoint(roomId));
      const roomData = roomResponse.data || roomResponse;

      // Check if room exists
      if (!roomData || !(roomData._id || roomData.id)) {
        throw new Error('Room not found');
      }

      // Check if user is already a member
      const membersResponse = await ApiClient.get<any>(ApiClient.getChatRoomEndpoint(roomId));
      const membersData = membersResponse.data || membersResponse;

      // Handle different response formats
      let isMember = false;
      if (membersData.members) {
        if (Array.isArray(membersData.members)) {
          const memberIds = RoomMapper.extractMemberIds(membersData.members);
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
          room: RoomMapper.mapRoomForJoin(roomData),
        };
      }

      // Check if room is full
      const currentMembers = (roomData.members as any[]) || [];
      if (currentMembers.length >= roomData.capacity) {
        return {
          success: false,
          message: 'Room is full',
        };
      }

      // Try to join the room
      await ApiClient.post(ApiClient.getRoomJoinEndpoint(roomId));

      return {
        success: true,
        room: RoomMapper.mapRoomForJoin(roomData),
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
      const creatorId = await ApiClient.getUserId();

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

      const result = await ApiClient.postFormData<any>(ApiClient.getRoomsEndpoint(), formData);
      return result;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }

  async updateRoom(roomId: string, data: UpdateRoomDto): Promise<ChatRoom | null> {
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.image) formData.append('image', data.image);

      const result = await ApiClient.putFormData<any>(ApiClient.getRoomEndpoint(roomId), formData);
      
      // Update cache
      CacheManager.updateRoom(roomId, result.data);
      CacheManager.updateRoomInList(roomId, result.data);
      
      return result.data;
    } catch (error) {
      console.error('Error updating room:', error);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      await ApiClient.delete(ApiClient.getRoomEndpoint(roomId));
      
      // Clear cache
      CacheManager.clearRoom(roomId);
      CacheManager.removeRoomFromList(roomId);
      
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  async leaveRoom(roomId: string): Promise<boolean> {
    try {
      await ApiClient.post(ApiClient.getRoomLeaveEndpoint(roomId));
      
      // Update cache
      CacheManager.updateRoom(roomId, { is_member: false });
      CacheManager.updateRoomInList(roomId, { is_member: false });
      
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      return false;
    }
  }

  // Room Lists
  async getMyRooms(): Promise<ChatRoom[]> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getChatRoomsEndpoint());
      const rooms = RoomMapper.mapRoomsResponse(response);
      return rooms.map(room => ({ ...room, is_member: true }));
    } catch (error) {
      console.error('Error fetching my rooms:', error);
      return [];
    }
  }

  async getDiscoverRooms(): Promise<ChatRoom[]> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getRoomsEndpoint());
      const rooms = RoomMapper.mapRoomsResponse(response);
      return rooms.map(room => ({ ...room, is_member: false }));
    } catch (error) {
      console.error('Error fetching discover rooms:', error);
      return [];
    }
  }

  async getAllRoomsForUser(): Promise<ChatRoom[]> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getAllRoomsForUserEndpoint());
      const rooms = RoomMapper.mapRoomsResponse(response);
      return rooms;
    } catch (error) {
      console.error('Error fetching all rooms for user:', error);
      return [];
    }
  }

  async getMyRoomsByApi(): Promise<ChatRoom[]> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getMyRoomsEndpoint());
      const rooms = RoomMapper.mapRoomsResponse(response);
      return rooms.map(room => ({ ...room, is_member: true }));
    } catch (error) {
      console.error('Error fetching my rooms:', error);
      return [];
    }
  }

  // Messages
  async sendMessage(data: SendMessageDto): Promise<ChatMessage | null> {
    try {
      const result = await ApiClient.post<any>(
        ApiClient.getRoomMessagesEndpoint(data.roomId),
        { text: data.text }
      );
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async markMessageAsRead(roomId: string, messageId: string): Promise<boolean> {
    try {
      await ApiClient.post(ApiClient.getMessageReadEndpoint(roomId, messageId));
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async getRoomMessages(roomId: string): Promise<any[]> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getRoomMessagesEndpoint(roomId));
      // สมมติ response เป็น array ของ message
      return response.data || response || [];
    } catch (error) {
      console.error('Error fetching room messages:', error);
      return [];
    }
  }

  // Members
  async getRoomsWithMembers(): Promise<{ rooms: { room: ChatRoom; members: string[] }[] }> {
    try {
      const response = await ApiClient.get<any>(ApiClient.getRoomsWithMembersEndpoint());

      const transformedRooms = response.rooms?.map((item: { room: ChatRoom; members: any[] }) => {
        const members = item.members || [];
        const memberIds = RoomMapper.extractMemberIds(members);
        return {
          room: item.room,
          members: memberIds,
        };
      }) || [];

      return { rooms: transformedRooms };
    } catch (error) {
      console.error('Error fetching rooms with members:', error);
      return { rooms: [] };
    }
  }

  async getRoomMembers(roomId: string): Promise<RoomMembersResponse | null> {
    try {
      const result = await ApiClient.get<any>(ApiClient.getRoomMembersEndpoint(roomId));

      // Map ให้ user มี _id เสมอ
      if (result.members && Array.isArray(result.members)) {
        result.members = result.members.map((member: RoomMember) => ({
          ...member,
          user: {
            ...member.user,
            _id: member.user._id,
          },
        }));
      }

      return result;
    } catch (error) {
      console.error('Error fetching room members:', error);
      return null;
    }
  }

  async getRoomMembersPaginated(
    roomId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MembersResponse | null> {
    try {
      const endpoint = `${ApiClient.getRoomMembersEndpoint(roomId)}?page=${page}&limit=${limit}`;
      const result = await ApiClient.get<any>(endpoint);

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

  // WebSocket Management
  async connectToWebSocket(roomId: string, userId: string): Promise<WebSocket> {
    return WebSocketManager.connect(roomId);
  }

  async disconnectWebSocket(roomId: string): Promise<void> {
    WebSocketManager.disconnect(roomId);
  }

  // Cache Management
  clearCache(): void {
    CacheManager.clearAll();
  }

  getCacheStats() {
    return CacheManager.getCacheStats();
  }
}

export default new ChatService();