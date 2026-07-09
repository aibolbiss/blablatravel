export default function SkeletonCard() {
  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card animate-pulse">
      {/* Image placeholder */}
      <div className="relative aspect-[4/3] bg-route-light/30" />
      
      {/* Content placeholder */}
      <div className="p-4">
        {/* Profile section */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-route-light/30" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 rounded bg-route-light/30" />
            <div className="h-2 w-16 rounded bg-route-light/30" />
          </div>
        </div>
        
        {/* Title placeholder */}
        <div className="mt-3 space-y-2">
          <div className="h-3 rounded bg-route-light/30" />
          <div className="h-3 w-3/4 rounded bg-route-light/30" />
        </div>
        
        {/* Route placeholder */}
        <div className="mt-3 h-3 w-1/2 rounded bg-route-light/30" />
        
        {/* Date placeholder */}
        <div className="mt-2 h-3 w-2/5 rounded bg-route-light/30" />
      </div>
    </div>
  );
}
