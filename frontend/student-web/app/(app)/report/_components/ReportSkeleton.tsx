'use client';

import { Card } from '@heroui/react';

export function ReportSkeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent px-4 z-50">
      <Card className="w-full max-w-xl py-6 px-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl animate-pulse">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white/20 rounded-full" />
            <div className="h-6 w-24 bg-white/20 rounded" />
          </div>

          {/* Topic Select */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/20 rounded" />
            <div className="h-10 w-full bg-white/10 rounded-xl" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/20 rounded" />
            <div className="h-32 w-full bg-white/10 rounded-xl" />
            <div className="h-4 w-20 ml-auto bg-white/20 rounded" />
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-3 pt-2">
            <div className="h-10 w-24 bg-white/20 rounded-full" />
            <div className="h-10 w-28 bg-white/20 rounded-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}
