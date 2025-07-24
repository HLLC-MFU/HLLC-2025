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
    // Prioritize room.image for discover page
    if (room.image) {
      if (room.image.startsWith('http')) {
        return room.image;
      }
      return `${CHAT_BASE_URL}/uploads/${room.image}`;
    }
    
    // Fallback to image_url
    if (room.image_url) {
      if (room.image_url.startsWith('http')) {
        return room.image_url;
      }
      return `${CHAT_BASE_URL}/uploads/${room.image_url}`;
    }
    
    return undefined;
  };

  const imageUrl = getImageUrl();
  const memberCount = room?.members_count || 0;

  return (
    <div
      className="relative group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:rotate-1"
      style={{ 
        width: '100%', 
        maxWidth: '100%',
        minWidth: '200px'
      }}
      onClick={onShowDetail ? onShowDetail : onPress}
      role="button"
      tabIndex={0}
    >
      {/* Glass morphism card with enhanced effects */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/40 shadow-2xl hover:shadow-white/20 transition-all duration-500">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none z-10 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />
        
        {/* Image container with enhanced styling */}
        <div className="w-full h-28 bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={room.name?.th || room.name?.en || 'Room'}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
              onError={e => { 
                console.log('[RoomCard] Image failed to load, using fallback');
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-emoji');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback emoji - always present but hidden when image loads */}
          <div className={`fallback-emoji ${imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:scale-105 transition-transform duration-500`}>
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300">🏠</span>
          </div>
        </div>

        {/* Info container with enhanced glass effect */}
        <div className="p-2 space-y-2 relative z-30 bg-white/5 backdrop-blur-sm">
          {/* Room name and status in same row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-white text-sm truncate leading-tight drop-shadow-lg flex-1 min-w-0">
              {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
            </h3>
            
            {/* Status Badge */}
            {room.status && (
              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                room.status === 'inactive' 
                  ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
                  : room.status === 'active'
                  ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                  : 'bg-gray-500/20 text-gray-200 border border-gray-400/30'
              }`}>
                <div className={`w-1 h-1 rounded-full ${
                  room.status === 'inactive' ? 'bg-red-400' : 
                  room.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                {room.status === 'inactive' ? 'inactive' : 
                 room.status === 'active' ? 'active' : room.status}
              </div>
            )}
          </div>
          
          {/* Room type and group type badges */}
          <div className="flex flex-wrap gap-1">
            {/* MC Room badge only */}
            {room.type === 'mc' && (
              <div className="inline-block bg-blue-600/80 text-white text-xs font-bold rounded-full px-2 py-1 border border-blue-200/50 shadow-lg ml-1">
                Master of Ceremonies Room
              </div>
            )}
            {/* Room type badge for other types */}
            {room.type && room.type !== 'mc' && (
              <div className="inline-block bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full px-2 py-1 border border-white/30 shadow-lg">
                {room.type}
              </div>
            )}
            {/* Group type badge */}
            {room.metadata?.isGroupRoom && room.metadata?.groupType && (
              <div className="inline-block bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full px-2 py-1 border border-purple-300/30 shadow-lg">
                {room.metadata.groupType}
              </div>
            )}
          </div>
          
          {/* Members count */}
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs">👥</span>
            </div>
            <span className="text-white/90 text-xs font-medium">{memberCount} Members</span>
          </div>
          
          {/* Join button */}
          {onJoin && (
            <button
              onClick={e => { e.stopPropagation(); onJoin(); }}
              className="mt-1 w-full bg-white/15 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full px-2 py-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 active:scale-95 transform text-xs"
              type="button"
            >
              <span className="flex items-center justify-center gap-1">
                <span className="text-xs">✨</span>
                {language === 'th' ? 'เข้าร่วม' : 'Join'}
                <span className="text-xs">✨</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;