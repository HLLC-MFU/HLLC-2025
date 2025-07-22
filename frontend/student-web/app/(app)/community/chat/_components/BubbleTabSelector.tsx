import React from 'react';

type TabKey = 'my' | 'discover';

type Tab = { key: TabKey; label: string };
type Props = {
  tabs: Tab[];
  activeKey: TabKey;
  onSelect: (key: TabKey) => void;
};

export default function BubbleTabSelector({ tabs, activeKey, onSelect }: Props) {
  return (
    <div className="flex flex-row items-center justify-center bg-[#2E2E2E] rounded-full p-1 my-3 mx-6">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={`flex-1 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${isActive ? 'bg-green-600 shadow-md' : 'bg-transparent'} mx-1`}
            style={{ minWidth: 0 }}
            type="button"
          >
            <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
