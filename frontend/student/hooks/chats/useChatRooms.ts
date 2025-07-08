import { useState, useCallback, useMemo } from 'react';
import { ChatRoom } from '../../types/chatTypes';
import chatService from '@/services/chats/chatService';

export const useChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let allRooms: ChatRoom[] = [];
      if (activeTab === 'my') {
        allRooms = await chatService.getMyRoomsByApi();
      } else {
        allRooms = await chatService.getAllRoomsForUser();
      }
      setRooms(allRooms);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  const myRooms = rooms;
  const discoverRooms = rooms;

  const filteredRooms = useMemo(() => {
    const baseRooms = activeTab === 'my' ? myRooms : discoverRooms;
    return baseRooms.filter(room => {
      const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
      return matchesCategory;
    });
  }, [activeTab, myRooms, discoverRooms, selectedCategory]);

  return {
    rooms,
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