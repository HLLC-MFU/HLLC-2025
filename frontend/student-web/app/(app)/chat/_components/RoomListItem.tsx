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
  let imageUrl = room.image_url || room.image;
  if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
    imageUrl = `${CHAT_BASE_URL}/uploads/${imageUrl}`;
  }
  return (
    <div
      className="flex flex-row items-center bg-white/40 backdrop-blur-lg backdrop-saturate-150 ring-1 ring-white/40 border border-white/30 rounded-2xl p-5 mb-3 shadow-xl transition-all"
      style={{ width: (width - 52) / 2, minHeight: 80 }}
      onClick={() => { console.log('RoomListItem pressed', room.id); onPress(); }}
    >
      <div className="mr-4">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
          ) : (
            <span className="text-indigo-500 text-xl font-bold">{avatarChar}</span>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-base font-bold text-white/90 drop-shadow truncate">
          {language === 'th' ? room.name?.th || 'Unnamed' : room.name?.en || 'Unnamed'}
        </div>
        <div className="flex flex-row items-center gap-4 mt-0.5">
          <div className="flex flex-row items-center gap-1">
            <Users size={13} color="#ffffffb0" />
            <span className="text-xs text-white/80 ml-1">{room.members_count ?? 0} Members</span>
          </div>
          <div className="flex flex-row items-center gap-1">
            <Clock size={12} color="#ffffffb0" />
            <span className="text-xs text-white/80 ml-1">
              {room.type === 'readonly'
                ? (language === 'th' ? 'อ่านอย่างเดียว' : 'Read-only')
                : room.type === 'normal'
                  ? (language === 'th' ? 'ปกติ' : 'Normal')
                  : '-' }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomListItem; 