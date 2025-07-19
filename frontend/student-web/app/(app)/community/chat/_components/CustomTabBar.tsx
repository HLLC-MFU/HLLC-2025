import React from 'react';

interface CustomTabBarProps {
  activeTab: 'my' | 'discover';
  onTabChange: (tab: 'my' | 'discover') => void;
  language: string;
}

const CustomTabBar = ({
  activeTab,
  onTabChange,
  language,
}: CustomTabBarProps) => {
  return (
    <div className="flex flex-row mx-5 my-3 h-12 bg-black/80 rounded-2xl p-1 relative overflow-hidden">
      <button
        className={`flex-1 flex items-center justify-center h-10 rounded-xl font-bold text-base transition-colors duration-200 ${activeTab === 'my' ? 'text-white' : 'text-white/60'}`}
        onClick={() => onTabChange('my')}
        type="button"
      >
        {language === 'th' ? 'ห้องของฉัน' : 'My Rooms'}
      </button>
      <button
        className={`flex-1 flex items-center justify-center h-10 rounded-xl font-bold text-base transition-colors duration-200 ${activeTab === 'discover' ? 'text-white' : 'text-white/60'}`}
        onClick={() => onTabChange('discover')}
        type="button"
      >
        {language === 'th' ? 'ค้นหาห้อง' : 'Discover'}
      </button>
      {/* Animated indicator */}
      <div
        className="absolute top-1 left-1 h-10 w-1/2 rounded-xl bg-gradient-to-r from-green-500 to-green-800 transition-transform duration-300 z-0"
        style={{ transform: `translateX(${activeTab === 'my' ? '0%' : '100%'})` }}
      />
    </div>
  );
};

export default CustomTabBar; 