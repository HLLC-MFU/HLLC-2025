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
    <div className="mb-5 overflow-x-auto">
      <div className="flex flex-row gap-2 px-5">
        {Categories.map(({ name, color }) => (
          <button
            key={name}
            className={`rounded-full px-4 py-2 transition-colors duration-200 border border-white/20 ${selectedCategory === name ? '' : 'bg-white/10'} `}
            style={selectedCategory === name ? { background: `linear-gradient(90deg, ${color}, ${color}dd)` } : {}}
            onClick={() => onCategoryChange(name)}
            type="button"
          >
            <span className={`text-sm font-semibold ${selectedCategory === name ? 'text-white' : 'text-white/70'}`}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
