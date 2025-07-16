import React from 'react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';

interface RoomCardProps {
  room: ChatRoom;
  width: number;
  language: string;
  onPress: () => void;
  onJoin?: () => void;
  onShowDetail?: () => void;
  index: number;
}

const RoomCard = ({ room, width, language, onPress, onJoin, onShowDetail }: RoomCardProps) => {
  const getImageUrl = () => {
    if (room.image) return `${CHAT_BASE_URL}/uploads/${room.image}`;
    return undefined;
  };

  const imageUrl = getImageUrl();
  const memberCount = room?.members_count;

  return (
    <div
      className="flex flex-col bg-black/20 rounded-2xl overflow-hidden relative shadow-md"
      style={{ width: (width - 66) / 2, minWidth: 180, maxWidth: 260, margin: 8 }}
      onClick={onShowDetail ? onShowDetail : onPress}
      role="button"
      tabIndex={0}
    >
      <div className="w-full aspect-[1.7] bg-indigo-100 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={room.name?.th || room.name?.en || 'Room'}
            className="w-full h-full object-cover rounded-t-2xl"
            onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-100 rounded-t-2xl">
            <span className="text-3xl">🏠</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <span className="font-bold text-white text-base truncate">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </span>
        {room.category && (
          <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold rounded px-2 py-1 mb-1">
            {room.category}
          </span>
        )}
        <div className="flex flex-row items-center gap-2 mb-1">
          <span className="text-white text-xs">👥</span>
          <span className="text-white text-xs">{memberCount} Members</span>
        </div>
        {onJoin && (
          <button
            onClick={e => { e.stopPropagation(); onJoin(); }}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded px-4 py-2 transition"
            type="button"
          >
            {language === 'th' ? 'เข้าร่วม' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;