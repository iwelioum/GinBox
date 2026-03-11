interface SkeletonShimmerProps {
  className?: string;
}

export function SkeletonShimmer({ className = '' }: SkeletonShimmerProps) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}
