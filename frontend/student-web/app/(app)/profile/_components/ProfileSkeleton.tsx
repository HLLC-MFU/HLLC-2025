import { Card, Skeleton } from "@heroui/react";

const skeletonPairs = 4;

export function ProfileSkeleton() {
  return (
    <Card className="w-full mx-auto py-4 bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg">
      <div className="pb-0 pt-2 px-4 flex flex-col space-y-6">
        {Array.from({ length: skeletonPairs }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 min-h-[60px]" role="presentation">
            <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-white/80" />
            <div className="flex flex-col space-y-1 flex-1">
              <Skeleton className="h-4 w-1/3 rounded-lg bg-white/30" />
              <Skeleton className="h-5 w-2/3 rounded-lg bg-white/20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
