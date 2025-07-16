"use client";

import React, { useEffect, useState } from 'react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import chatService from '@/services/chats/chatService';

interface RoomDetailModalProps {
  visible: boolean;
  room: ChatRoom | null;
  language: string;
  onClose: () => void;
}

interface Member {
  user_id: string;
  username: string;
}

export const RoomDetailModal = ({ visible, room, language, onClose }: RoomDetailModalProps) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="backdrop-blur-md bg-slate-800/90 rounded-2xl p-8 w-[340px] flex flex-col items-center shadow-xl relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={room.name?.th || room.name?.en || 'Room'}
            className="w-32 h-20 rounded-xl object-cover mb-4"
            onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
        )}
        <span className="text-lg font-bold text-white mb-2">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </span>
        {room.category && (
          <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold rounded px-2 py-1 mb-2">
            {room.category}
          </span>
        )}
        <span className="text-white text-base mt-4 mb-2">สมาชิกในห้อง ({members.length})</span>
        <div className="w-full max-h-32 overflow-y-auto flex flex-col items-center">
          {loading ? (
            <span className="text-blue-400 text-lg">🔄 กำลังโหลด...</span>
          ) : members.length === 0 ? (
            <span className="text-gray-300 text-sm mt-2">ไม่มีสมาชิก</span>
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
        <button
          onClick={onClose}
          className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded px-6 py-2 transition"
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RoomDetailModal; 