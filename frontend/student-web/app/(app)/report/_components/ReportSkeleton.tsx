'use client';

import { Card, Skeleton } from '@heroui/react';

export function ReportSkeleton() {
  return (
    <Card className="bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg max-w-xl mx-auto px-4 py-10">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-full bg-white/60" />
          <Skeleton className="h-6 w-32 rounded-lg bg-white/40" />
        </div>

        {/* Topic Select */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/30 rounded-lg" />
          <Skeleton className="h-10 w-full bg-white/20 rounded-lg" />
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/30 rounded-lg" />
          <Skeleton className="h-32 w-full bg-white/20 rounded-lg" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24 rounded-lg bg-white/30" />
          <Skeleton className="h-10 w-28 rounded-lg bg-white/50" />
        </div>
      </div>
    </Card>
  );
}
