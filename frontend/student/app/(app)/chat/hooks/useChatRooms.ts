import { useState, useCallback, useMemo } from 'react';
import { chatService } from '../services/chatService';
import { ChatRoom } from '../types/chatTypes';

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
      const allRooms = await chatService.getRooms();
      setRooms(allRooms);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const myRooms = useMemo(() => rooms.filter(r => r.is_member), [rooms]);
  const discoverRooms = useMemo(() => rooms.filter(r => !r.is_member), [rooms]);

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