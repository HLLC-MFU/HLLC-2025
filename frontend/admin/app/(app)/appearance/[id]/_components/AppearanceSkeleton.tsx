import { Card, Divider, Skeleton } from '@heroui/react';

import HeaderSkeleton from '@/components/ui/breadcrumbSkeleton';

export function AppearanceSkeleton() {
  return (
    <>
      <HeaderSkeleton />

      <div className="flex items-center gap-4 w-full mx-auto mb-4">
        <Skeleton className="h-10 w-32 rounded-xl bg-gray-200 mb-2" />
      </div>

      <div className="w-full h-full mx-auto">
        <div className="grid gap-8 w-full h-full mx-auto">
          <Card className="flex gap-6 p-4 h-full">
            <div className="flex gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex flex-col justify-between">
                <Skeleton className="w-28 h-6 rounded-md" />
                <Skeleton className="w-20 h-4 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-28 h-10 rounded-lg" />
            <Divider />
            <Skeleton className="w-full h-full rounded-lg" />
          </Card>
        </div>
      </div>
    </>
  );
}
