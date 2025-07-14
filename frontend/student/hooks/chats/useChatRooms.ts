import { useState, useCallback, useMemo } from 'react';
import { ChatRoom } from '../../types/chatTypes';
import chatService from '@/services/chats/chatService';

export const useChatRooms = () => {
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [discoverRooms, setDiscoverRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [myRoomsData, discoverRoomsData] = await Promise.all([
        chatService.getMyRoomsByApi(),
        chatService.getAllRoomsForUser(),
      ]);
      setMyRooms(myRoomsData);
      setDiscoverRooms(discoverRoomsData);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setMyRooms([]);
      setDiscoverRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filteredRooms = useMemo(() => {
    const baseRooms = activeTab === 'my' ? myRooms : discoverRooms;
    return baseRooms.filter(room => {
      const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
      return matchesCategory;
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