import React, { memo } from 'react';
import { AvatarProps } from '@/types/chat';
import { AVATAR_COLORS } from '@/constants/chats/chatConstants';

const Avatar = memo(({ name, online, size = 40 }: AvatarProps) => {
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  return (
    <div className="relative mr-2">
      <div
        className="flex items-center justify-center rounded-full text-white font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: getAvatarColor(name),
          fontSize: Math.max(12, size * 0.4),
        }}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
            online ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar; 