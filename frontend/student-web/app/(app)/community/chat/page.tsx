"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useChatRooms } from '@/hooks/chats/useChatRooms';
import CategoryFilter from '@/app/(app)/community/chat/_components/CategoryFilter';
import { ChatTabBar } from '@/app/(app)/community/chat/_components/ChatTabBar';
import RoomCard from '@/app/(app)/community/chat/_components/RoomCard';
import RoomListItem from '@/app/(app)/community/chat/_components/RoomListItem';
import ConfirmJoinModal from '@/app/(app)/community/chat/_components/ConfirmJoinModal';
import chatService from '@/services/chats/chatService';
import { MessageSquare } from 'lucide-react';
import { ScrollShadow } from '@heroui/react';
import RoomDetailModal from './_components/RoomDetailModal';
import { ChatRoom } from '@/types/chat';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

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
  const { language } = useLanguage();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [confirmJoinVisible, setConfirmJoinVisible] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoomWithId | null>(null);
  const [joining, setJoining] = useState(false);
  const userId = user?._id || '';

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
        router.push(`/community/chat/${roomId}`);
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
        router.push(`/community/chat/${rid}`);
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
      metadata: item.metadata || {},
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
        onPress={() => { }}
        language={language}
      />
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
        {/* Tab Bar + Category Filter */}
        <ChatTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          language={language}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Scrollable content */}
        <ScrollShadow
          className={`flex-1 overflow-auto ${activeTab === 'discover'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'flex flex-col gap-2'
            } pb-32`}
          hideScrollBar
        >
          {filteredRooms.map((item: ChatRoomWithId, idx: number) => renderRoomItem(item, idx))}

          {filteredRooms.length === 0 && (
            <div className="flex flex-col gap-4 items-center justify-center py-24 col-span-full">
              <MessageSquare size={48} color="#F8F8F8" />
              <span className="text-white/90 font-normal mb-3">No chat rooms found</span>
            </div>
          )}
        </ScrollShadow>
      </div>

      <RoomDetailModal
        visible={detailModalVisible}
        room={selectedRoom}
        language={language}
        onClose={() => setDetailModalVisible(false)}
      />

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