import React from 'react';
import { Users, Clock } from 'lucide-react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';

interface RoomListItemProps {
  room: ChatRoom;
  language: 'en' | 'th';
  onPress: () => void;
  index: number;
  width: number;
}

const RoomListItem = ({ room, language, onPress, width }: RoomListItemProps) => {
  const avatarChar = room.name[language]?.charAt(0)?.toUpperCase() || '?';

  // Prioritize room.image
  let imageUrl = room.image || room.image_url;
  if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
    imageUrl = `${CHAT_BASE_URL}/uploads/${imageUrl}`;
  }

  return (
    <div
      className="group flex flex-row items-center bg-white/8 backdrop-blur-xl border border-white/40 rounded-2xl p-5 mb-4 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:shadow-white/20 cursor-pointer"
      onClick={() => { console.log('RoomListItem pressed', room.id); onPress(); }}
    >
      {/* Enhanced avatar container */}
      <div className="mr-5 relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/30 transition-all duration-500">
          {imageUrl ? (
            <img
              src={imageUrl}
              className="w-14 h-14 rounded-full object-cover transition-all duration-500"
              alt="avatar"
            />
          ) : (
            <span className="text-indigo-500 text-2xl font-bold transition-transform duration-300">{avatarChar}</span>
          )}
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Enhanced info container */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-white/95 drop-shadow-lg truncate leading-tight flex-1 min-w-0">
            {room.name[language] ?? 'Unnamed'}
          </div>
        </div>

        <div className="flex flex-row items-center gap-6">
          <div className="flex flex-row items-center gap-2 group/item">
            <Users size={16} className="text-white/80" />
            <span className="text-sm text-white/80">
              {room.members_count ?? 0} Members
            </span>
          </div>

          {/* Room type and group type badges */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/60 ">
            <Clock width={16} />
            {room.type === 'readonly'
              ? (language === 'th' ? 'อ่านอย่างเดียว' : 'Read-only')
              : room.type === 'normal'
                ? (language === 'th' ? 'ปกติ' : 'Normal')
                : room.type
            }
            {/* Group type badge */}
            {room.metadata?.isGroupRoom && room.metadata?.groupType && (
              <p className="capitalize">{room.metadata.groupType}</p>
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