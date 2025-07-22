"use client"

import { Card, Skeleton } from '@heroui/react';

export default function SkeletonCoinHuntingPage() {
  return (
    <div style={{ flex: 1, height: '100vh', backgroundColor: 'transparent' }}>
      {/* TopBar Skeleton */}
      <div className="flex items-center justify-between px-4 py-3">
        <Skeleton className="w-24 h-8 rounded-lg" />
        <Skeleton className="w-32 h-8 rounded-lg" />
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
      {/* Map Skeleton */}
      <Card className="mx-4 mt-2 flex-1 flex items-center justify-center min-h-[400px]">
        <Skeleton className="w-full h-[300px] rounded-lg" />
      </Card>
    </div>
  );
} 