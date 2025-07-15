'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function ProgressBar({
  progress = 88,
  avatarUrl = '/avatar.png',
  onClickAvatar,
}: {
  progress: number;
  avatarUrl?: string;
  onClickAvatar?: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-48 md:w-[16rem] lg:w-[24rem] max-w-full mx-4 mt-6 flex items-center gap-2">
      {/* Avatar Circle */}
      <button
        className="z-10 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-500/50 bg-gray-300/30 backdrop-blur-md overflow-hidden shadow-md flex items-center justify-center"
        onClick={onClickAvatar}
      >
        {imageError ? (
          <div className="flex items-center justify-center w-full h-full bg-gray-50">
            <User className="text-gray-400 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
          </div>
        ) : (
          <Image
            fill
            alt="Avatar"
            className="object-cover"
            src={avatarUrl || '/avatar.png'}
            onError={() => setImageError(true)}
          />
        )}
      </button>

      {/* Progress Bar Container */}
      <div className="relative flex-1 h-7 sm:h-7 md:h-10 rounded-full -ml-6 bg-black/10 backdrop-blur-md border border-black/20 shadow-inner overflow-hidden">
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />

        {/* Percentage Bubble */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 pointer-events-none transition-all duration-300"
          style={{
            left: `calc(max(0.5rem, min(${progress}%, 100% - 3.5rem)))`,
          }}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}
