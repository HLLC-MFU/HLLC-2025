import React from 'react';
import { Categories } from '@/constants/chats/categories';
import { Button, Chip, ScrollShadow } from '@heroui/react';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { language } = useLanguage();
  const selectedIndex = Categories.findIndex(category => category.name.en === selectedCategory);
  const pillWidth = 100 / Categories.length;

  return (
    <div className="mb-6 overflow-hidden">
      <ScrollShadow className="flex md:justify-center gap-2 z-10 overflow-x-auto py-1 pr-4" orientation="horizontal" hideScrollBar>
        {Categories.map((category) => (
          <Button
            key={category.key}
            className={`bg-white/20 border border-white/20 rounded-full transition-all duration-300 font-bold border text-xs sm:text-sm whitespace-nowrap relative overflow-hidden ${selectedCategory === category.key
              ? `text-white`
              : 'text-white/60 hover:text-white/95'
              }`}
            style={
              selectedCategory === category.key
                ? { backgroundColor: category.color }
                : {}
            }
            onPress={() => onCategoryChange(category.key)}
            type="button"
          >
            <span className="text-[14px] font-semibold tracking-wide relative z-10">{category.name[language]}</span>
          </Button>
        ))}
      </ScrollShadow>
      {/* </div> */}
    </div>
  );
}
