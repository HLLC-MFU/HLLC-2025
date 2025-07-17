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
    <div className="mx-5 mb-4 rounded-2xl overflow-hidden shadow-xl relative bg-white/40 backdrop-blur-lg backdrop-saturate-150 ring-1 ring-white/40 border border-white/30 flex flex-row items-center p-1 transition-all">
      {tabs.map(({ key, label, icon }, idx) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            className={`flex-1 flex flex-row items-center justify-center gap-2 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-green-600 text-white drop-shadow-lg' : 'bg-transparent text-white/80'}`}
            onClick={() => onTabChange(key as 'my' | 'discover')}
            type="button"
          >
            <span>{icon}</span>
            <span className={`text-base font-semibold`}>{label(language)}</span>
          </button>
        );
      })}
      {/* Animated pill (simple) */}
      <div
        className="absolute top-1 bottom-1 left-1 w-1/2 rounded-lg bg-white/20 transition-transform duration-300 z-0"
        style={{ transform: `translateX(${activeTab === 'discover' ? '0%' : '100%'})` }}
      />
    </div>
  );
};

export default ChatTabBar; 