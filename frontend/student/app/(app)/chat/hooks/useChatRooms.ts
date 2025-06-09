import { useState, useCallback, useMemo } from 'react';
import { chatService } from '../services/chatService';
import { ChatRoom } from '../types/chatTypes';

interface ChatRoomsState {
  rooms: ChatRoom[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  activeTab: 'my' | 'discover';
  selectedCategory: string;
}

export const useChatRooms = () => {
  const [state, setState] = useState<ChatRoomsState>({
    rooms: [],
    loading: true,
    refreshing: false,
    error: null,
    activeTab: 'discover',
    selectedCategory: 'All'
  });

  const updateState = useCallback((updates: Partial<ChatRoomsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const allRooms = await chatService.getRooms();
      updateState({ rooms: allRooms });
    } catch (err) {
      console.error('Error loading rooms:', err);
      updateState({ 
        error: 'Failed to load chat rooms',
        rooms: []
      });
    } finally {
      updateState({ 
        loading: false,
        refreshing: false
      });
    }
  }, [updateState]);

  const myRooms = useMemo(() => 
    state.rooms.filter(r => r.is_member), 
    [state.rooms]
  );

  const discoverRooms = useMemo(() => 
    state.rooms.filter(r => !r.is_member), 
    [state.rooms]
  );

  const filteredRooms = useMemo(() => {
    const baseRooms = state.activeTab === 'my' ? myRooms : discoverRooms;
    return baseRooms.filter(room => 
      state.selectedCategory === 'All' || room.category === state.selectedCategory
    );
  }, [state.activeTab, state.selectedCategory, myRooms, discoverRooms]);

  return {
    ...state,
    filteredRooms,
    setActiveTab: (tab: 'my' | 'discover') => updateState({ activeTab: tab }),
    setSelectedCategory: (category: string) => updateState({ selectedCategory: category }),
    setRefreshing: (refreshing: boolean) => updateState({ refreshing }),
    loadRooms
  };
}; 