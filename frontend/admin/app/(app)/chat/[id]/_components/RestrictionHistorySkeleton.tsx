export function RestrictionHistorySkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-default-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-default-200 bg-default-50">
        <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
        <div>
          <div className="h-5 w-40 bg-default-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-24 bg-default-200 rounded animate-pulse" />
        </div>
      </div>
      {/* Filter bar */}
      <div className="p-2 border-b border-default-200 bg-default-50 flex gap-4">
        <div className="h-10 w-64 bg-default-200 rounded animate-pulse" />
      </div>
      {/* Table skeleton */}
      <div className="p-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse" />
            <div className="h-10 w-16 bg-default-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
} 