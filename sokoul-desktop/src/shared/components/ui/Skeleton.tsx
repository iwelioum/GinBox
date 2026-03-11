// NAME — Skeleton.tsx — Role: Skeleton loader placeholder
import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

export interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'rail' | 'poster' | 'hero' | 'inline';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded',
  card: 'w-full aspect-[2/3] rounded-[var(--radius-card)]',
  circle: 'h-12 w-12 rounded-full',
  rail: 'w-56 aspect-[2/3] flex-shrink-0 rounded-[var(--radius-card)]',
  poster: 'w-40 h-60 aspect-[2/3] flex-shrink-0 rounded-[var(--radius-card)]',
  hero: 'w-full h-[65vh] rounded-none',
  inline: 'h-4 rounded',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    ...(width != null && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height != null && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn('skeleton-shimmer bg-[var(--color-bg-elevated)]', variantClasses[variant], className)}
      style={style}
    />
  ));

  if (count === 1) return items[0]!;
  return <div className="flex flex-col gap-2">{items}</div>;
}

export default Skeleton;
