"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useChatRooms } from '@/hooks/chats/useChatRooms';
import CategoryFilter from '@/app/(app)/chat/_components/CategoryFilter';
import ChatHeader from '@/app/(app)/chat/_components/ChatHeader';
import { ChatTabBar } from '@/app/(app)/chat/_components/ChatTabBar';
import RoomCard from '@/app/(app)/chat/_components/RoomCard';
import RoomListItem from '@/app/(app)/chat/_components/RoomListItem';
import ConfirmJoinModal from '@/app/(app)/chat/_components/ConfirmJoinModal';
import chatService from '@/services/chats/chatService';

interface ChatRoomWithId {
  id?: string;
  _id?: string;
  name?: any;
  is_member?: boolean;
  [key: string]: any;
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useProfile();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomWithId | null>(null);
  const [confirmJoinVisible, setConfirmJoinVisible] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoomWithId | null>(null);
  const [joining, setJoining] = useState(false);
  const userId = user?._id || '';
  const language = 'en';

  const {
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
  } = useChatRooms();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const joinRoom = async (roomId: string) => {
    if (!roomId) return;
    const room = (rooms as ChatRoomWithId[]).find(r => r.id === roomId || r._id === roomId);
    setPendingJoinRoom(room || null);
    setConfirmJoinVisible(true);
  };

  const handleConfirmJoin = async () => {
    const pendingRoom = pendingJoinRoom as ChatRoomWithId | null;
    const roomId = (pendingRoom?.id || pendingRoom?._id) ?? null;
    if (!pendingRoom || !roomId) {
      console.error('No valid room to join');
      return;
    }
    
    if (!userId) {
      alert('Please login to join rooms');
      return;
    }
    
    setJoining(true);
    setConfirmJoinVisible(false);
    
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please login to join rooms');
        return;
      }

      // Use the correct API endpoint and headers based on the curl command
      const response = await fetch(`http://localhost:1334/api/rooms/${roomId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh rooms to update member status
        await loadRooms();
        router.push(`/chat/${roomId}`);
      } else {
        const errorText = await response.text();
        console.error('Join room error:', errorText);
        alert('Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Cannot join room');
    } finally {
      setJoining(false);
      setPendingJoinRoom(null);
    }
  };

  const handleCancelJoin = () => {
    setConfirmJoinVisible(false);
    setPendingJoinRoom(null);
  };

  const navigateToRoom = async (rid: string, isMember: boolean) => {
    try {
      if (isMember) {
        router.push(`/chat/${rid}`);
      } else {
        await joinRoom(rid);
      }
    } catch (error) {
      alert('Cannot access room');
    }
  };

  const handleTabChange = (tab: 'my' | 'discover') => {
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRooms();
    } finally {
      setRefreshing(false);
    }
  };

  const renderRoomItem = (item: ChatRoomWithId, index: number) => {
    const roomId = item.id || item._id;
    const chatRoom: any = {
      id: item.id || item._id || '',
      name: item.name || { th: '', en: '' },
      capacity: item.capacity || 0,
      creator_id: item.creator_id || '',
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      members_count: item.members_count || 0,
      type: item.type || 'normal',
      image: item.image || '',
      image_url: item.image_url || '',
      ...item,
    };
    
    if (activeTab === 'my') {
      return (
        <RoomListItem
          key={roomId}
          room={chatRoom}
          onPress={() => navigateToRoom(roomId as string, true)}
          index={index} 
          width={window.innerWidth}
          language={language}
        />
      );
    }
    
    const showRoomDetail = () => {
      setSelectedRoom(chatRoom);
      setDetailModalVisible(true);
    };
    
    return (
      <RoomCard
        key={roomId}
        room={chatRoom}
        width={window.innerWidth}
        onJoin={() => joinRoom(String(chatRoom.id))}
        onShowDetail={showRoomDetail}
        index={index}
        onPress={() => {}}
        language={language}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Enhanced background with subtle effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/2 to-transparent pointer-events-none" />
      
      <div className="flex-1 w-full relative z-10">
        <ChatHeader
          roomsCount={rooms.length}
          joinedRoomsCount={rooms.filter(r => r.is_member).length}
          language={language}
        />
        <ChatTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          language={language}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        {/* Enhanced Rooms Grid/List Container - Full Width */}
        <div className={`${
          activeTab === 'discover' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'flex flex-col gap-4'
        } px-4 pb-32 pt-6`}> 
          {filteredRooms.map((item: ChatRoomWithId, idx: number) => renderRoomItem(item, idx))}
          
          {filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 col-span-full">
              <div className="text-7xl mb-8 animate-bounce">✨</div>
              <span className="text-2xl text-white/90 font-bold mb-3">No communities found</span>
              <span className="text-sm text-white/60 text-center max-w-md">
                Try adjusting your filters or check back later for new communities
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Join Modal */}
      <ConfirmJoinModal
        visible={confirmJoinVisible}
        room={pendingJoinRoom}
        language={language}
        onConfirm={handleConfirmJoin}
        onCancel={handleCancelJoin}
      />
    </div>
  );
}