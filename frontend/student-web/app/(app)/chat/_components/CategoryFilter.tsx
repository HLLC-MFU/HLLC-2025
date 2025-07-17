import React from 'react';
import { Categories } from '@/constants/chats/categories';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="mb-5 overflow-x-auto px-0">
      <div className="flex flex-row gap-2 px-0 py-2 bg-white/30 backdrop-blur-lg backdrop-saturate-150 ring-1 ring-white/40 border border-white/30 shadow-xl rounded-2xl transition-all">
        {Categories.map(({ name, color }) => (
          <button
            key={name}
            className={`rounded-full px-4 py-2 transition-colors duration-200 border border-white/30 shadow-sm text-white/90 font-semibold ${selectedCategory === name ? '' : 'bg-white/10'} `}
            style={selectedCategory === name ? { background: `linear-gradient(90deg, ${color}, ${color}dd)` } : {}}
            onClick={() => onCategoryChange(name)}
            type="button"
          >
            <span className={`text-sm font-semibold`}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
