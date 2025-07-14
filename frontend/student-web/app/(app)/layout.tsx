'use client';

import type React from 'react';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { ProgressSummaryCard } from './(index)/_components/ProgressSummaryCard';

import BottomNav from '@/components/bottom-nav';
import lobby from '@/public/lobby.png';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const steps = 9000;
  const progressPercentage = 75;
  const progressLoading = false;
  const deviceMismatch = false;

  const assetsImage = {
    lamduan: null,
    profile: null,
    notification: null,
    background: null,
    progress: null,
  };

  const shouldBlur = pathname !== '/';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <Image
        fill
        priority
        alt="Background"
        className="absolute inset-0 object-cover z-0"
        src={lobby}
      />

      {/* Conditional blur overlay */}
      {shouldBlur && (
        <div className="absolute inset-0 z-10 bg-black/10 backdrop-blur-sm" />
      )}

      {/* Foreground content */}
      <div className="relative z-20 flex h-full flex-col text-foreground">
        <main className="flex-1 overflow-y-auto md:px-8 pb-20">
          <ProgressSummaryCard
            healthData={{ steps, deviceMismatch }}
            progressImage={assetsImage.progress}
            progressLoading={progressLoading}
            progressPercentage={progressPercentage}
            onClick={() => (window.location.href = '/profile')}
          />
          {children}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 mx-4 pb-4">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
