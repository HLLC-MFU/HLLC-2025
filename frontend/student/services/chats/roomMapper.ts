import { ChatRoom, RoomMember, User } from '../../types/chatTypes';
import { MemberLike, BackendRoomData } from './types';

// Extended ChatRoom interface for internal use
interface ExtendedChatRoom extends ChatRoom {
  members?: (string | MemberLike)[];
}

export class RoomMapper {
  /**
   * Maps backend room data to ChatRoom interface
   */
  static mapRoomData(room: BackendRoomData): ChatRoom {
    return {
      id: room._id,
      name: {
        th: room.name?.th || '',
        en: room.name?.en || '',
      },
      description: room.description,
      capacity: room.capacity,
      creator_id: room.createdBy || '',
      image: room.image,
      created_at: room.createdAt || '',
      updated_at: room.updatedAt || '',
      is_member: room.is_member !== undefined 
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
  }

  /**
   * Maps an array of backend room data to ChatRoom array
   */
  static mapRoomsData(rooms: BackendRoomData[]): ChatRoom[] {
    return rooms.map(room => this.mapRoomData(room));
  }

  /**
   * Maps backend room data to ExtendedChatRoom interface (for internal use)
   */
  static mapExtendedRoomData(room: BackendRoomData): ExtendedChatRoom {
    const baseRoom = this.mapRoomData(room);
    return {
      ...baseRoom,
      members: room.members,
    };
  }

  /**
   * Maps backend response to ChatRoom array, handling different response formats
   */
  static mapRoomsResponse(result: { data?: BackendRoomData[]; rooms?: BackendRoomData[] }): ChatRoom[] {
    const rooms = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.rooms)
      ? result.rooms
      : [];
    
    return this.mapRoomsData(rooms);
  }

  /**
   * Maps member data to RoomMember interface
   */
  static mapMemberData(member: { user: { _id: string; name?: any; username?: string; profile_image_url?: string } }): RoomMember {
    return {
      user_id: member.user._id,
      user: {
        _id: member.user._id,
        name: member.user.name || { first: '', middle: '', last: '' },
        username: member.user.username || '',
        profile_image_url: member.user.profile_image_url,
      },
    };
  }

  /**
   * Maps an array of member data to RoomMember array
   */
  static mapMembersData(members: { user: { _id: string; name?: any; username?: string; profile_image_url?: string } }[]): RoomMember[] {
    return members.map(member => this.mapMemberData(member));
  }

  /**
   * Extracts user IDs from member objects, handling different formats
   */
  static extractMemberIds(members: (string | MemberLike)[]): string[] {
    return members
      .map(member => 
        typeof member === 'string' 
          ? member 
          : member.user_id || member.id
      )
      .filter((id): id is string => id !== undefined && id !== null);
  }

  /**
   * Checks if a user is a member of a room
   */
  static isUserMember(userId: string, members: (string | MemberLike)[]): boolean {
    const memberIds = this.extractMemberIds(members);
    return memberIds.includes(userId);
  }

  /**
   * Maps room data for join response
   */
  static mapRoomForJoin(roomData: BackendRoomData): ChatRoom {
    return {
      id: roomData._id,
      name: {
        th: roomData.name?.th || '',
        en: roomData.name?.en || '',
      },
      description: roomData.description,
      capacity: roomData.capacity,
      creator_id: roomData.createdBy || '',
      image: roomData.image,
      created_at: roomData.createdAt || '',
      updated_at: roomData.updatedAt || '',
      is_member: true,
      category: roomData.category,
      members_count: roomData.memberCount || 
        (Array.isArray(roomData.members) ? roomData.members.length : 0),
      last_message: roomData.last_message,
      last_message_time: roomData.last_message_time,
      image_url: roomData.image_url,
    };
  }
} 