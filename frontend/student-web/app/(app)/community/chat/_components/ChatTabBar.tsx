import { MessageCircle, Sparkles } from 'lucide-react';
import React from 'react';

interface ChatTabBarProps {
  language: string;
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
}

const tabs = [
  { key: 'discover', label: (lang: string) => lang === 'th' ? 'ค้นพบ' : 'Discover', icon: Sparkles },
  { key: 'my', label: (lang: string) => lang === 'th' ? 'ของฉัน' : 'My Rooms', icon: MessageCircle },
];

export const ChatTabBar = ({ language, activeTab, onTabChange }: ChatTabBarProps) => {
  return (
    <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl relative bg-white/8 backdrop-blur-xl border border-white/40 flex flex-row items-center transition-all duration-500 hover:bg-white/12 group">
      {/* Enhanced animated background pill that fills the entire container */}
      <div
        className="absolute h-4/5 w-[48%] rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-700 ease-out shadow-lg"
        style={{ 
          left: activeTab === 'discover' ? '1%' : '51%',
        }}
      />
      
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            className={`flex-1 flex flex-row items-center justify-center gap-3 py-4 px-6 transition-all duration-500 font-bold relative z-10 ${
              isActive 
                ? 'text-white' 
                : 'text-white/70 hover:text-white/90'
            }`}
            onClick={() => onTabChange(key as 'my' | 'discover')}
            type="button"
          >
            <span className={`text-xl transition-all duration-500`}>
              <Icon />
            </span>
            <span className="text-base font-bold tracking-wide">{label(language)}</span>
          </button>
        );
      })}
      
      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default ChatTabBar; 