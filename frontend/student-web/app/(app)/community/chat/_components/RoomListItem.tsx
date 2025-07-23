import React from 'react';
import { Users, Clock } from 'lucide-react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';

interface RoomListItemProps {
  room: ChatRoom;
  language: string;
  onPress: () => void;
  index: number;
  width: number;
}

const RoomListItem = ({ room, language, onPress, width }: RoomListItemProps) => {
  const avatarChar = (language === 'th' ? room.name?.th : room.name?.en)?.charAt(0)?.toUpperCase() || '?';
  
  // Prioritize room.image
  let imageUrl = room.image || room.image_url;
  if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
    imageUrl = `${CHAT_BASE_URL}/uploads/${imageUrl}`;
  }
  
  return (
    <div
      className="group flex flex-row items-center bg-white/8 backdrop-blur-xl border border-white/40 rounded-2xl p-5 mb-4 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:shadow-white/20 hover:scale-[1.02] hover:rotate-1 cursor-pointer"
      style={{ width: '100%', minHeight: 80 }}
      onClick={() => { console.log('RoomListItem pressed', room.id); onPress(); }}
    >
      {/* Enhanced avatar container */}
      <div className="mr-5 relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/30 transition-all duration-500 group-hover:scale-110 group-hover:border-white/50">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              className="w-14 h-14 rounded-full object-cover transition-all duration-500 group-hover:scale-125" 
              alt="avatar" 
            />
          ) : (
            <span className="text-indigo-500 text-2xl font-bold group-hover:scale-110 transition-transform duration-300">{avatarChar}</span>
          )}
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* Enhanced info container */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-white/95 drop-shadow-lg truncate leading-tight flex-1 min-w-0">
            {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
          </div>
          
          {/* Status Badge */}
          {room.status && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              room.status === 'inactive' 
                ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
                : room.status === 'active'
                ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                : 'bg-gray-500/20 text-gray-200 border border-gray-400/30'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                room.status === 'inactive' ? 'bg-red-400' : 
                room.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
              {room.status === 'inactive' ? 'inactive' : 
               room.status === 'active' ? 'active' : room.status}
            </div>
          )}
        </div>
        
        <div className="flex flex-row items-center gap-6">
          <div className="flex flex-row items-center gap-2 group/item">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-white/30">
              <Users size={14} className="text-white/80" />
            </div>
            <span className="text-sm text-white/80 font-medium group-hover/item:text-white/95 transition-colors duration-300">
              {room.members_count ?? 0} Members
            </span>
          </div>
          
          {/* Room type and group type badges */}
          <div className="flex flex-wrap gap-2">
            {/* MC Room badge only */}
            {room.type === 'mc' && (
              <div className="inline-block bg-blue-600/80 text-white text-xs font-bold rounded-full px-2 py-1 border border-blue-200/50 shadow-lg ml-1">
                Master of Ceremonies Room
              </div>
            )}
            {/* Room type badge for other types */}
            {room.type && room.type !== 'mc' && (
              <div className="inline-block bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full px-2 py-1 border border-white/30">
                {room.type === 'readonly'
                  ? (language === 'th' ? 'อ่านอย่างเดียว' : 'Read-only')
                  : room.type === 'normal'
                    ? (language === 'th' ? 'ปกติ' : 'Normal')
                    : room.type}
              </div>
            )}
            {/* Group type badge */}
            {room.metadata?.isGroupRoom && room.metadata?.groupType && (
              <div className="inline-block bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full px-2 py-1 border border-purple-300/30">
                {room.metadata.groupType}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default RoomListItem; 