import { SkeletonShimmer } from '@/shared/components/ui';

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]" role="status" aria-label="Loading content">
      {/* Hero skeleton */}
      <div className="relative w-full" style={{ height: 'var(--detail-hero-height)' }}>
        <SkeletonShimmer className="absolute inset-0 rounded-none" />
        <div className="absolute bottom-0 left-0 right-0 px-16 pb-16 z-10 space-y-4">
          <SkeletonShimmer className="h-4 w-48" />
          <SkeletonShimmer className="h-16 w-96" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonShimmer key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3">
            <SkeletonShimmer className="h-12 w-32 rounded-xl" />
            <SkeletonShimmer className="h-12 w-32 rounded-xl" />
            <SkeletonShimmer className="h-12 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Stats strip skeleton */}
      <div className="px-16 py-8">
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonShimmer key={i} className="h-28 w-36 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Story section skeleton */}
      <div className="px-16 py-16">
        <SkeletonShimmer className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-3">
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-4 w-3/4" />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-4 w-2/3" />
          </div>
        </div>
      </div>

      {/* Cast section skeleton */}
      <div className="px-16 py-16">
        <SkeletonShimmer className="h-8 w-24 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <SkeletonShimmer className="aspect-[2/3] rounded-xl" />
              <SkeletonShimmer className="h-4 w-3/4 rounded mt-2" />
              <SkeletonShimmer className="h-3 w-1/2 rounded mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
