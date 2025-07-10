import { ChatRoom } from '../../types/chatTypes';
import { RoomCache, RoomListCache } from './types';

export class CacheManager {
  private static roomCache = new Map<string, RoomCache>();
  private static roomListCache: RoomListCache = {
    data: null,
    timestamp: 0,
    CACHE_DURATION: 30 * 1000, // 30 seconds
  };

  private static readonly ROOM_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached room data
   */
  static getRoom(roomId: string): ChatRoom | null {
    const cached = this.roomCache.get(roomId);
    if (cached && Date.now() - cached.timestamp < this.ROOM_CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set room cache
   */
  static setRoom(roomId: string, room: ChatRoom): void {
    this.roomCache.set(roomId, {
      data: room,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached room list
   */
  static getRoomList(): ChatRoom[] | null {
    if (
      this.roomListCache.data &&
      Date.now() - this.roomListCache.timestamp < this.roomListCache.CACHE_DURATION
    ) {
      return this.roomListCache.data;
    }
    return null;
  }

  /**
   * Set room list cache
   */
  static setRoomList(rooms: ChatRoom[]): void {
    this.roomListCache.data = rooms;
    this.roomListCache.timestamp = Date.now();
  }

  /**
   * Clear room cache
   */
  static clearRoom(roomId: string): void {
    this.roomCache.delete(roomId);
  }

  /**
   * Clear room list cache
   */
  static clearRoomList(): void {
    this.roomListCache.data = null;
    this.roomListCache.timestamp = 0;
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    this.roomCache.clear();
    this.clearRoomList();
  }

  /**
   * Update room in cache if it exists
   */
  static updateRoom(roomId: string, updates: Partial<ChatRoom>): void {
    const cached = this.roomCache.get(roomId);
    if (cached) {
      this.roomCache.set(roomId, {
        data: { ...cached.data, ...updates },
        timestamp: cached.timestamp,
      });
    }
  }

  /**
   * Update room in room list cache if it exists
   */
  static updateRoomInList(roomId: string, updates: Partial<ChatRoom>): void {
    if (this.roomListCache.data) {
      const roomIndex = this.roomListCache.data.findIndex(room => room.id === roomId);
      if (roomIndex !== -1) {
        this.roomListCache.data[roomIndex] = {
          ...this.roomListCache.data[roomIndex],
          ...updates,
        };
      }
    }
  }

  /**
   * Remove room from room list cache
   */
  static removeRoomFromList(roomId: string): void {
    if (this.roomListCache.data) {
      this.roomListCache.data = this.roomListCache.data.filter(
        room => room.id !== roomId
      );
    }
  }

  /**
   * Add room to room list cache
   */
  static addRoomToList(room: ChatRoom): void {
    if (this.roomListCache.data) {
      this.roomListCache.data.unshift(room);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    roomCacheSize: number;
    roomListCached: boolean;
    roomListAge: number;
  } {
    return {
      roomCacheSize: this.roomCache.size,
      roomListCached: this.roomListCache.data !== null,
      roomListAge: this.roomListCache.data 
        ? Date.now() - this.roomListCache.timestamp 
        : 0,
    };
  }
} 