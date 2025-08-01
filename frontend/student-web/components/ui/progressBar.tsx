'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSseStore } from '@/stores/useSseStore';

export default function ProgressBar({
  colors,
  avatarUrl = '/avatar.png',
  onClickAvatar,
}: {
  colors: Record<string, string> | undefined;
  avatarUrl?: string;
  onClickAvatar?: () => void;
}) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Zustand store
  const progress = useSseStore(state => state.progress);
  const percentage = Math.round(progress?.progressPercentage ?? 0);
  const fetchUserProgress = useSseStore(state => state.fetchUserProgress);

  useEffect(() => {
    fetchUserProgress();
  }, []);

  useEffect(() => {
    if (avatarUrl) setImageError(false);
  }, [avatarUrl]);

  return (
    <div className="relative w-48 md:w-[16rem] lg:w-[24rem] max-w-full flex items-center gap-2">
      {/* Avatar Circle */}
      <button
        className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full border-2 border-gray-500/50 bg-gray-300/30 backdrop-blur-md overflow-hidden shadow-md flex items-center justify-center"
        onClick={onClickAvatar ?? (() => router.push('/profile'))}
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
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `50%`, backgroundImage: `linear-gradient(to right, ${colors?.primary ?? '#62cff4'}, ${colors?.secondary ?? '#2c67f2'})` }}
        />

        {/* Percentage Bubble */}
        <div
          className="absolute top-1/2 right-5 -translate-y-1/2 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 pointer-events-none transition-all duration-300"
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}
