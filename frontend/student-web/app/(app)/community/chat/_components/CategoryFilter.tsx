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
    <div className="mb-6 px-2 sm:px-4">
      <div className="grid grid-cols-5 gap-1 sm:gap-2 py-3 sm:py-4 bg-white/8 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl transition-all duration-500 hover:bg-white/12 group">
        {Categories.map(({ name, color }) => (
          <button
            key={name}
            className={`rounded-full px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 border-2 font-bold text-xs sm:text-sm whitespace-nowrap hover:scale-105 active:scale-95 relative overflow-hidden ${
              selectedCategory === name 
                ? 'text-white shadow-lg shadow-white/20 border-white/40 bg-white/15' 
                : 'text-white/70 border-white/20 hover:text-white/95 hover:border-white/40 hover:bg-white/5'
            }`}
            onClick={() => onCategoryChange(name)}
            type="button"
          >
            <span className="font-bold tracking-wide relative z-10">{name}</span>
            
            {/* Subtle shimmer effect for selected items */}
            {selectedCategory === name && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse" />
            )}
          </button>
        ))}
        
        {/* Subtle shimmer effect for the entire container */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 pointer-events-none rounded-2xl" />
      </div>
    </div>
  );
}
