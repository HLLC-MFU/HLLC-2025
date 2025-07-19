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
      className="relative group cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:rotate-1"
      style={{ width: (width - 66) / 2, minWidth: 180, maxWidth: 260, margin: 8 }}
      onClick={onShowDetail ? onShowDetail : onPress}
      role="button"
      tabIndex={0}
    >
      {/* Glass morphism card with enhanced effects */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-[24px] overflow-hidden border border-white/40 shadow-2xl hover:shadow-white/20 transition-all duration-500">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none z-10 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />
        
        {/* Image container with enhanced styling */}
        <div className="w-full aspect-[1.7] bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={room.name?.th || room.name?.en || 'Room'}
              className="w-full h-full object-cover rounded-t-[20px] transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
              onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-[20px] group-hover:scale-105 transition-transform duration-500">
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🏠</span>
            </div>
          )}
        </div>

        {/* Info container with enhanced glass effect */}
        <div className="p-4 space-y-3 relative z-30 bg-white/5 backdrop-blur-sm">
          <h3 className="font-bold text-white text-[16px] truncate leading-tight drop-shadow-lg">
            {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
          </h3>
          
          {room.category && (
           <div className="inline-block bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full px-3 py-1.5 border border-white/30 shadow-lg">
              {room.category}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs">👥</span>
            </div>
            <span className="text-white/90 text-xs font-medium">{memberCount} Members</span>
          </div>
          
          {onJoin && (
            <button
              onClick={e => { e.stopPropagation(); onJoin(); }}
              className="mt-3 w-full bg-white/15 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full px-4 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 active:scale-95 transform"
              type="button"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-sm">✨</span>
                {language === 'th' ? 'เข้าร่วม' : 'Join'}
                <span className="text-sm">✨</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;