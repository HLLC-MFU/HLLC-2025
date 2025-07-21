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
  const selectedIndex = Categories.findIndex(cat => cat.name === selectedCategory);
  const pillWidth = 100 / Categories.length;

  return (
    <div className="mb-6 px-2 sm:px-4">
      <div className="relative py-3 sm:py-4 bg-white/8 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl transition-all duration-500 hover:bg-white/12 group overflow-hidden">
        <div
          className="absolute inset-0 bg-white/20 backdrop-blur-sm border-2 border-white/50 transition-all duration-700 ease-out shadow-lg"
          style={{ 
            left: `${selectedIndex * pillWidth}%`,
            width: `${pillWidth}%`,
            borderRadius: selectedIndex === 0 
              ? '12px 0 0 12px' 
              : selectedIndex === Categories.length - 1 
              ? '0 12px 12px 0' 
              : '0',
          }}
        />
        
        <div className="grid grid-cols-5 relative z-10">
          {Categories.map(({ name }) => (
            <button
              key={name}
              className={`rounded-full px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 font-bold text-xs sm:text-sm whitespace-nowrap hover:scale-105 active:scale-95 relative overflow-hidden ${
                selectedCategory === name 
                  ? 'text-white' 
                  : 'text-white/70 hover:text-white/95'
              }`}
              onClick={() => onCategoryChange(name)}
              type="button"
            >
              <span className="font-bold tracking-wide relative z-10">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
