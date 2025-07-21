"use client";

import Link from "next/link";
import { useState } from "react";

interface GameCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  isSelected: boolean;
  hasNew?: boolean;
}

function GameCard({ title, description, href, icon, isSelected, hasNew = false }: GameCardProps) {
  return (
    <Link href={href} className="block group">
      <div 
        className={`relative p-8 bg-white/10 backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden cursor-pointer ${
          isSelected 
            ? 'border-yellow-400 bg-yellow-400/20 shadow-2xl shadow-yellow-400/30' 
            : 'border-white/30 hover:border-white/50'
        }`}
        style={{ 
          minHeight: '280px',
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
        }}
      >
        {/* Background glow for selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent animate-pulse" />
        )}
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Icon */}
          <div className={`text-6xl mb-6 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
          </div>
          
          {/* Title */}
          <h3 className={`text-2xl font-bold mb-4 transition-colors ${
            isSelected ? 'text-yellow-300' : 'text-white group-hover:text-white/90'
          }`}>
            {title}
          </h3>
          
          {/* Description */}
          <p className={`text-sm leading-relaxed flex-grow transition-colors ${
            isSelected ? 'text-yellow-200/80' : 'text-white/70 group-hover:text-white/80'
          }`}>
            {description}
          </p>
          
          {/* NEW badge */}
          {hasNew && (
            <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          )}
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const gameCards: GameCardProps[] = [
    {
      title: "COLLECT COINS",
      description: "ล่าสมบัติและเก็บเหรียญในโลกเสมือนจริง พร้อมกับเพื่อนๆ ในชุมชน",
      href: "/community/coin-hunting",
      icon: "🪙",
      isSelected: selectedIndex === 0
    },
    {
      title: "CHAT ROOM",
      description: "สนทนาและแลกเปลี่ยนความคิดเห็นกับเพื่อนๆ ในห้องแชทที่หลากหลาย",
      href: "/community/chat",
      icon: "💬",
      isSelected: selectedIndex === 1,
      hasNew: true
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Futuristic background elements */}
      <div className="absolute inset-0 opacity-30" />
      
      {/* Blurred background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📦</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              COMMUNITY HUB
            </h1>
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {gameCards.map((card, index) => (
              <div 
                key={card.href}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <GameCard {...card} isSelected={selectedIndex === index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}