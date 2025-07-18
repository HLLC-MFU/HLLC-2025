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
    setConfirmJoinVisible(false);
    try {
      const result = await chatService.joinRoom(roomId);
      if (result.success) {
        router.push(`/chat/${roomId}`);
      } else {
        alert(result.message || 'Failed to join room');
      }
    } catch (error) {
      alert('Cannot join room');
    }
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
          index={index} width={0}
          language={language}
        />
      );
    }
    const showRoomDetail = () => {
      setSelectedRoom(chatRoom);
      setDetailModalVisible(true);
    };
    return (
      <div
        key={roomId}
        className="bg-white/70 rounded-2xl mb-3 mr-3 shadow-md overflow-hidden flex-1 min-w-[200px] max-w-[320px]"
        onClick={showRoomDetail}
        style={{ cursor: 'pointer' }}
      >
        <RoomCard
          room={chatRoom}
          width={320}
          onJoin={() => joinRoom(String(chatRoom.id))}
          onShowDetail={showRoomDetail}
          index={index}
          onPress={() => {}}
          language={language}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 w-full max-w-3xl mx-auto">
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
        <div className={`grid ${activeTab === 'discover' ? 'grid-cols-2 gap-4' : 'flex flex-col gap-3'} px-5 pb-32`}> 
          {filteredRooms.map((item: ChatRoomWithId, idx: number) => renderRoomItem(item, idx))}
          {filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 col-span-2">
              <span className="text-5xl mb-4">✨</span>
              <span className="text-lg text-white">No communities found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}