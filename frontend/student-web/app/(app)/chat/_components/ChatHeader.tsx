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
    <div className="pt-6 pb-6 px-4 w-full">
      <div className="flex flex-col gap-6 w-full">
        {/* Welcome Section with enhanced styling */}
        <div className="flex flex-row justify-between items-center mb-6">
          <div className="space-y-3">
            <span className="text-sm text-white/70 font-medium tracking-wide">
              {language === 'th' ? 'สวัสดี!' : 'Welcome!'}
            </span>
            <div className="text-4xl font-bold text-white drop-shadow-2xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {language === 'th' ? 'ชุมชนของเรา' : 'Our Community'}
            </div>
          </div>
        </div>
        
        {/* Enhanced Stats Cards with glass morphism */}
        <div className="flex flex-row justify-around items-center bg-white/8 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl px-10 py-10 w-full transition-all duration-500 hover:bg-white/12 hover:shadow-white/20 group">
          {/* Total Rooms with enhanced effects */}
          <div className="flex flex-col items-center gap-4 group/item">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:border-white/50 group-hover/item:shadow-blue-500/30">
              <span role="img" aria-label="users" className="text-4xl group-hover/item:scale-110 transition-transform duration-300">👥</span>
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-white drop-shadow-2xl block group-hover/item:scale-105 transition-transform duration-300">
                {roomsCount}
              </span>
              <span className="text-sm text-white/70 font-medium tracking-wide">
                {language === 'th' ? 'ห้องทั้งหมด' : 'Total Rooms'}
              </span>
            </div>
          </div>
          
          {/* Joined Rooms with enhanced effects */}
          <div className="flex flex-col items-center gap-4 group/item">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400/20 to-blue-400/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:border-white/50 group-hover/item:shadow-green-500/30">
              <span role="img" aria-label="messages" className="text-4xl group-hover/item:scale-110 transition-transform duration-300">💬</span>
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-white drop-shadow-2xl block group-hover/item:scale-105 transition-transform duration-300">
                {joinedRoomsCount}
              </span>
              <span className="text-sm text-white/70 font-medium tracking-wide">
                {language === 'th' ? 'เข้าร่วมแล้ว' : 'Joined'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Shimmer effect for the entire header */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 pointer-events-none rounded-3xl" />
      </div>
    </div>
  );
}

