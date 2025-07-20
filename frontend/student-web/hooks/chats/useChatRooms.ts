"use client";
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChatRoom } from '@/types/chat';
import chatService from '@/services/chats/chatService';
import { useProfile } from '@/hooks/useProfile';

export const useChatRooms = () => {
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [discoverRooms, setDiscoverRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { user } = useProfile();

  const loadRooms = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        setError('getToken called on server');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setLoading(true);
      setError(null);
      const [myRoomsData, discoverRoomsData] = await Promise.all([
        chatService.getMyRoomsByApi(),
        chatService.getAllRoomsForUser(),
      ]);
      setMyRooms(myRoomsData);
      setDiscoverRooms(discoverRoomsData);
    } catch (err) {
      console.error('[useChatRooms] Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setMyRooms([]);
      setDiscoverRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const filteredRooms = useMemo(() => {
    const baseRooms = activeTab === 'my' ? myRooms : discoverRooms;
    
    return baseRooms.filter(room => {
      if (selectedCategory === 'All') {
        return true;
      }
      
      // Handle different category types
      switch (selectedCategory) {
        case 'normal':
          return room.type === 'normal';
        case 'readonly':
          return room.type === 'readonly';
        case 'major':
          // Check if it's a group room with major type
          return room.metadata?.isGroupRoom === true && room.metadata?.groupType === 'major';
        case 'school':
          // Check if it's a group room with school type
          return room.metadata?.isGroupRoom === true && room.metadata?.groupType === 'school';
        default:
          return false;
      }
    });
  }, [activeTab, myRooms, discoverRooms, selectedCategory]);

  return {
    rooms: activeTab === 'my' ? myRooms : discoverRooms,
    loading,
    refreshing,
    error,
    activeTab,
    selectedCategory,
    filteredRooms,
    setActiveTab,
    setSelectedCategory,
    loadRooms,
    setRefreshing,
  };
}; 