import React, { MouseEvent } from 'react';
import { ChatRoom } from '@/types/chat';
import { CHAT_BASE_URL } from '@/configs/chats/chatConfig';
import { Users } from 'lucide-react';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

interface RoomCardProps {
  room: ChatRoom;
  width: number;
  language: 'th' | 'en';
  onPress: () => void;
  onJoin?: () => void;
  onShowDetail?: () => void;
  index: number;
}

const RoomCard = ({ room, width, language, onPress, onJoin, onShowDetail }: RoomCardProps) => {
  const { t } = useTranslation();

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
      className="relative group cursor-pointer hover:scale-95 duration-300"
      onClick={onShowDetail ? onShowDetail : onPress}
      role="button"
      tabIndex={0}
    >
      <div
        className="relative bg-white/10 backdrop-blur-xl rounded-[20px] overflow-hidden border border-white/40 shadow-2xl"
      >
        {/* Image container */}
        <div className="w-full h-28 bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={room.name[language] || 'Room'}
              className="w-full h-full object-cover transition-all duration-700"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-emoji');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
        </div>

        {/* Info container */}
        <div className="p-2 space-y-2 relative z-30 bg-white/5 backdrop-blur-sm">
          {/* Room name */}
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-white text-lg truncate leading-tight drop-shadow-lg flex-1 min-w-0">
              {room.name[language] ?? 'Unnamed'}
            </p>
          </div>

          {/* Members count */}
          <div className="flex items-center gap-1">
            <Users size={16} className="text-white/80" />
            <span className="text-white/90 text-sm">{memberCount} {t('chat.member')}</span>
          </div>

          {/* Join button */}
          {onJoin && (
            <div className="flex justify-center z-50" onClick={e => e.stopPropagation()}>
              <Button
                onPress={() => onJoin()}
                className="mt-1 bg-white/15 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white font-semibold rounded-full text-xs"
                type="button"
              >
                <span className="flex items-center justify-center gap-1">
                  {t('global.join')}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;