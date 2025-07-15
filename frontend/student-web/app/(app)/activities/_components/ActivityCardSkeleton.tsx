'use client';

export default function ActivityCardSkeleton() {
  return (
    <div className="w-full mb-5 animate-pulse">
      <div className="rounded-[32px] overflow-hidden shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
        <div className="relative h-[400px] flex flex-col justify-between">
          {/* Image placeholder */}
          <div className="absolute inset-0 bg-white/10" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/0 to-black/80" />

          {/* Top badge placeholder */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-end">
            <div className="h-6 w-20 bg-white/20 rounded-xl" />
          </div>

          {/* Bottom content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <div className="h-6 w-2/3 bg-white/30 rounded" />
            <div className="h-4 w-full bg-white/20 rounded" />
            <div className="h-4 w-5/6 bg-white/10 rounded" />
            <div className="h-6 w-40 bg-white/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
