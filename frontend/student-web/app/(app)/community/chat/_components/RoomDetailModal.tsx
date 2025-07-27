"use client";

import React, { useEffect, useState } from 'react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import chatService from '@/services/chats/chatService';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

interface RoomDetailModalProps {
  visible: boolean;
  room: ChatRoom | null;
  language: "th" | "en";
  onClose: () => void;
}

interface Member {
  user_id: string;
  username: string;
}

export const RoomDetailModal = ({ visible, room, language, onClose }: RoomDetailModalProps) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && room?.id) {
      setLoading(true);
      chatService.getRoomMembers(room.id)
        .then((res: any) => {
          const rawMembers = res?.data?.members || [];
          const safeMembers = rawMembers.map((m: any) => ({
            user_id: m.user_id || m.user?._id || '',
            username: m.user?.username || '',
          }));
          setMembers(safeMembers);
        })
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [visible, room?.id]);

  if (!visible || !room) return null;
  const imageUrl = room.image_url || room.image ? `${CHAT_BASE_URL}/uploads/${room.image_url || room.image}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="backdrop-blur-md bg-white/40 rounded-2xl p-6 w-full max-w-xs flex flex-col items-center shadow-xl relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={room.name[language] ?? 'Room'}
            className="w-24 h-16 rounded-lg object-cover mb-3"
            onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
        )}
        <span className="text-base font-bold text-white mb-2 text-center text-lg">
          {room.name[language] ?? 'Unnamed'}
        </span>
        {room.category && (
          <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold rounded px-2 py-1 mb-2">
            {room.category}
          </span>
        )}
        <span className="text-white text-sm mt-3 mb-2">{t('chat.member')} ({members.length})</span>
        <div className="w-full max-h-32 overflow-y-auto flex flex-col items-center">
          {loading ? (
            <span className="text-gray-300 text-lg">{t('global.loading')}</span>
          ) : members.length === 0 ? (
            <span className="text-gray-300 text-sm mt-2">{t('chat.noMembers')}</span>
          ) : (
            <div className="w-full flex flex-col items-center">
              {members.slice(0, 5).map((m) => (
                <span key={m.user_id} className="text-white text-sm mb-1 text-center">
                  {m.username || m.user_id}
                </span>
              ))}
              {members.length > 5 && (
                <span className="text-white text-sm mb-1 text-center">...</span>
              )}
            </div>
          )}
        </div>
        <Button
          onPress={onClose}
          className="mt-4 bg-white/20 text-white font-bold rounded-full px-4 py-2 text-sm border border-white/30"
          type="button"
        >
          {t('global.close')}
        </Button>
      </div>
    </div>
  );
};

export default RoomDetailModal; 