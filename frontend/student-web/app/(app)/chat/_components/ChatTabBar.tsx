import React from 'react';

interface ChatTabBarProps {
  language: string;
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
}

const tabs = [
  { key: 'discover', label: (lang: string) => lang === 'th' ? 'ค้นพบ' : 'Discover', icon: '✨' },
  { key: 'my', label: (lang: string) => lang === 'th' ? 'ของฉัน' : 'My Rooms', icon: '💬' },
];

export const ChatTabBar = ({ language, activeTab, onTabChange }: ChatTabBarProps) => {
  return (
    <div className="mx-4 mb-6 rounded-2xl overflow-hidden shadow-2xl relative bg-white/8 backdrop-blur-xl border border-white/40 flex flex-row items-center p-2 transition-all duration-500 hover:bg-white/12 group">
      {tabs.map(({ key, label, icon }, idx) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            className={`flex-1 flex flex-row items-center justify-center gap-3 py-4 px-6 rounded-xl transition-all duration-500 font-bold relative z-10 ${
              isActive 
                ? 'text-white shadow-lg scale-105' 
                : 'text-white/70 hover:text-white/90 hover:scale-102'
            }`}
            onClick={() => onTabChange(key as 'my' | 'discover')}
            type="button"
          >
            <span className={`text-xl transition-all duration-500 ${isActive ? 'scale-125 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
              {icon}
            </span>
            <span className="text-base font-bold tracking-wide">{label(language)}</span>
          </button>
        );
      })}
      
      {/* Enhanced animated background pill with softer colors */}
      <div
        className="absolute top-2 bottom-2 left-2 w-[calc(50%-4px)] rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-700 ease-out shadow-lg"
        style={{ 
          transform: `translateX(${activeTab === 'discover' ? '0%' : '100%'})`,
        }}
      />
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default ChatTabBar; 