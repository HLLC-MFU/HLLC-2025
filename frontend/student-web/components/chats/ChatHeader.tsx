import React from 'react';

interface ChatHeaderProps {
  language: string;
  roomsCount: number;
  joinedRoomsCount: number;
}

export default function ChatHeader({
  language,
  roomsCount,
  joinedRoomsCount,
}: ChatHeaderProps) {
  return (
    <div className="pt-4 pb-4 px-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center mb-5">
          <div>
            <span className="text-sm text-white/70 font-medium">
              {language === 'th' ? 'สวัสดี!' : 'Welcome!'}
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {language === 'th' ? 'ชุมชนของเรา' : 'Our Community'}
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-around bg-white/10 rounded-xl p-4 border border-white/20 shadow-sm mx-5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
              {/* Replace with Users icon */}
              <span role="img" aria-label="users">👥</span>
            </div>
            <span className="text-lg font-bold text-white">{roomsCount}</span>
            <span className="text-xs text-white/70 font-medium">{language === 'th' ? 'ห้อง' : 'Rooms'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1">
              {/* Replace with MessageCircle icon */}
              <span role="img" aria-label="messages">💬</span>
            </div>
            <span className="text-lg font-bold text-white">{joinedRoomsCount}</span>
            <span className="text-xs text-white/70 font-medium">{language === 'th' ? 'เข้าร่วม' : 'Joined'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

