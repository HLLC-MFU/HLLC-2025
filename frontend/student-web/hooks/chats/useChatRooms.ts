"use client";
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChatRoom } from '@/types/chat';
import chatService from '@/services/chats/chatService';
import { getToken } from '@/utils/storage';
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

  // Debug log on mount
  useEffect(() => {
    console.group('[useChatRooms] Debug Info');
    console.log('Mounted useChatRooms hook');
    console.log('typeof window:', typeof window);
    if (typeof window !== 'undefined') {
      console.log('document.cookie:', document.cookie);
      console.log('localStorage keys:', Object.keys(localStorage));
      console.log('localStorage accessToken:', localStorage.getItem('accessToken'));
    }
    console.log('user from useProfile:', user);
    console.groupEnd();
  }, [user]);

  const loadRooms = useCallback(async () => {
    console.group('[useChatRooms] loadRooms');
    try {
      if (typeof window === 'undefined') {
        console.warn('[useChatRooms] getToken called on server');
        setError('getToken called on server');
        setLoading(false);
        setRefreshing(false);
        console.groupEnd();
        return;
      }
      console.log('Start loading rooms...');
      setLoading(true);
      setError(null);
      const token = undefined; // ไม่ใช้ token แล้ว
      console.log('user:', user);
      // API call
      const [myRoomsData, discoverRoomsData] = await Promise.all([
        chatService.getMyRoomsByApi(),
        chatService.getAllRoomsForUser(),
      ]);
      setMyRooms(myRoomsData);
      setDiscoverRooms(discoverRoomsData);
      console.log('myRoomsData:', myRoomsData);
      console.log('discoverRoomsData:', discoverRoomsData);
    } catch (err) {
      console.error('[useChatRooms] Error loading rooms:', err);
      setError('Failed to load chat rooms');
      setMyRooms([]);
      setDiscoverRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('Loading complete. loading:', loading, 'refreshing:', refreshing, 'error:', error);
      console.groupEnd();
    }
  }, [user]);

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