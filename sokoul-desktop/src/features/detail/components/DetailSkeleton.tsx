export const DetailSkeleton = () => (
  <div className="min-h-screen bg-[var(--color-bg-base)]">
    {/* Hero backdrop shimmer */}
    <div className="relative h-[var(--detail-hero-height)]">
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-bg-base)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-base)] via-transparent to-transparent" />

      {/* Hero content skeleton */}
      <div className="absolute bottom-16 left-0 px-[var(--section-px)] space-y-5 w-full max-w-[800px]">
        {/* Type badge */}
        <div className="h-7 w-20 rounded-lg skeleton-shimmer" />
        {/* Title */}
        <div className="h-12 w-[60%] rounded-lg skeleton-shimmer" />
        {/* Tagline */}
        <div className="h-5 w-[40%] rounded skeleton-shimmer" />
        {/* Meta badges */}
        <div className="flex gap-3">
          <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-8 w-12 rounded skeleton-shimmer" />
          <div className="h-8 w-20 rounded skeleton-shimmer" />
          <div className="h-8 w-16 rounded-full skeleton-shimmer" />
          <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        </div>
        {/* Synopsis */}
        <div className="space-y-2 max-w-[600px]">
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-[90%] rounded skeleton-shimmer" />
          <div className="h-4 w-[70%] rounded skeleton-shimmer" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <div className="h-13 w-40 rounded-2xl skeleton-shimmer" />
          <div className="h-13 w-36 rounded-2xl skeleton-shimmer" />
          <div className="h-13 w-13 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    </div>

    {/* Content sections skeleton */}
    <div className="max-w-[var(--detail-content-max)] mx-auto px-[var(--section-px)] space-y-12 pb-24">
      {/* Info bar */}
      <div className="flex gap-8 py-5 border-t border-b border-[var(--color-border)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 rounded skeleton-shimmer" />
            <div className="h-4 w-24 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
      {/* Cast row */}
      <div className="space-y-4">
        <div className="h-4 w-28 rounded skeleton-shimmer" />
        <div className="flex gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-[72px] h-[72px] rounded-full skeleton-shimmer" />
              <div className="h-3 w-14 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
      {/* Stats grid */}
      <div className="space-y-4">
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
