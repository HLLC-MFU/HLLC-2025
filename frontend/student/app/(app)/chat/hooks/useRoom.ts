import { useState, useCallback, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { ChatRoom } from '../types/chatTypes';
import { ERROR_MESSAGES } from '../constants/chatConstants';
import { triggerSuccessHaptic } from '../utils/chatUtils';

export const useRoom = (roomId: string) => {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const initializeRoom = useCallback(async (roomData?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (roomData) {
        const parsedRoom = JSON.parse(roomData);
        setRoom(parsedRoom);
        setIsMember(parsedRoom.is_member || false);
      } else {
        const roomData = await chatService.getRoom(roomId);
        if (!roomData) {
          throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
        }
        setRoom(roomData);
        setIsMember(roomData.is_member || false);
      }
    } catch (err) {
      console.error('Error initializing room:', err);
      setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Initialize room on mount
  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  const handleJoin = useCallback(async () => {
    try {
      if (!room || room.is_member || joining) return;
      setJoining(true);
      setError(null);

      const result = await chatService.joinRoom(roomId);
      
      if (result.success && result.room) {
        setRoom(result.room);
        setIsMember(true);
        triggerSuccessHaptic();
        return true;
      } else {
        throw new Error(result.message || ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(ERROR_MESSAGES.JOIN_FAILED);
      return false;
    } finally {
      setJoining(false);
    }
  }, [room, roomId, joining]);

  return {
    room,
    isMember,
    loading,
    error,
    joining,
    initializeRoom,
    handleJoin,
  };
}; 