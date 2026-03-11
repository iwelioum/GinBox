// components/detail/StatsSection.tsx
// Grid 2×4 · EaseOut counters · Animated bars var(--accent)
// IntersectionObserver → triggers animations on scroll

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/shared/api/client';
import type { CatalogMeta, ContentType } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return active ? value : 0;
}

interface AnimatedNumberProps {
  value: number;
  active: boolean;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value, active, decimals = 0, suffix = '', prefix = '',
}) => {
  const raw       = useCountUp(Math.round(value * 10 ** decimals), active, 1500);
  const formatted = decimals > 0
    ? (raw / 10 ** decimals).toFixed(decimals)
    : raw.toLocaleString('en-US');
  return (
    <span
      style={{
        display: 'inline-block',
        opacity:   active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s, transform 0.4s',
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
};

interface StatEntry {
  label:    string;
  value:    number;
  percent:  number; // 0–100 for the bar
  decimals?: number;
  suffix?:   string;
  prefix?:   string;
  color?:    string;
}

const StatCard: React.FC<{ stat: StatEntry; active: boolean }> = ({ stat, active }) => (
  <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
    <span className="text-xs text-white/30 uppercase tracking-wide">
      {stat.label}
    </span>
    <span
      className="text-2xl font-extrabold"
      style={{ color: stat.color ?? 'var(--color-accent)' }}
    >
      <AnimatedNumber
        value={stat.value}
        active={active}
        decimals={stat.decimals ?? 0}
        suffix={stat.suffix ?? ''}
        prefix={stat.prefix ?? ''}
      />
    </span>
    {/* Progress bar */}
    <div className="h-0.5 bg-white/10 rounded-full mt-1">
      <div
        className="h-full rounded-full"
        style={{
          width: active ? `${Math.max(2, stat.percent)}%` : '0%',
          background: stat.color ?? 'var(--color-accent)',
          transition: 'width 1.5s cubic-bezier(0, 0, 0.2, 1)',
        }}
      />
    </div>
  </div>
);

interface TraktCommentData {
  id:        number;
  comment:   string;
  spoiler:   boolean;
  likes:     number;
  createdAt: string;
  author:    string;
}

const ReviewCard: React.FC<{ review: TraktCommentData }> = ({ review }) => {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{review.author}</span>
        <span className="text-[13px] text-white/40">{date}</span>
      </div>
      <p className="text-sm text-white/65 leading-relaxed line-clamp-4">
        {review.comment}
      </p>
      {review.likes > 0 && (
        <span className="text-[13px] text-white/35">♥ {review.likes}</span>
      )}
    </div>
  );
};

interface StatsSectionProps {
  // New API
  item?:  CatalogMeta;
  theme?: GenreTheme;
  // Legacy API (compatibility)
  type?:        ContentType;
  id?:          string;
  tmdbRating?: number;
  tmdbVotes?:  number;
  budget?:     number;
  revenue?:    number;
}

export const StatsSection: React.FC<StatsSectionProps> = (props) => {
  const { t } = useTranslation();
  const type       = (props.item?.type ?? props.type) as ContentType;
  const id         = props.item?.id   ?? props.id ?? '';
  const tmdbRating = props.item?.vote_average ?? props.tmdbRating;
  const tmdbVotes  = props.item?.vote_count   ?? props.tmdbVotes;
  const budget     = props.item?.budget        ?? props.budget;
  const revenue    = props.item?.revenue       ?? props.revenue;
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { data: trakt, isError: traktError } = useQuery({
    queryKey:  ['trakt-reviews', type, id],
    queryFn:   () => endpoints.trakt.getReviews(type, id).then(r => r.data),
    enabled:   !!type && !!id,
    staleTime: 15 * 60 * 1000,
  });

  // Normalization → bar percentage
  const toPercent = (val: number, max: number) =>
    Math.min(100, Math.round((val / max) * 100));

  const stats: StatEntry[] = [];

  if (tmdbRating != null && tmdbRating > 0)
    stats.push({ label: t('detail.tmdbRating'), value: tmdbRating, decimals: 1, suffix: '/10',
      percent: toPercent(tmdbRating, 10), color: 'var(--color-warning)' });

  if (tmdbVotes != null && tmdbVotes > 0)
    stats.push({ label: t('detail.tmdbVotes'), value: tmdbVotes,
      percent: toPercent(tmdbVotes, 50000) });

  if (trakt && trakt.votes > 0) {
    stats.push({ label: t('detail.traktRating'), value: trakt.rating, decimals: 1, suffix: '/10',
      percent: toPercent(trakt.rating, 10), color: 'var(--color-danger)' });
    if (trakt.pctLiked > 0)
      stats.push({ label: t('detail.liked'), value: trakt.pctLiked, suffix: '%',
        percent: trakt.pctLiked, color: 'var(--color-success)' });
  }

  if (type === 'movie' && budget != null && budget > 0)
    stats.push({ label: t('detail.budget'), value: Math.round(budget / 1_000_000),
      prefix: '$', suffix: 'M', percent: toPercent(budget, 500_000_000) });

  if (type === 'movie' && revenue != null && revenue > 0)
    stats.push({ label: t('detail.boxOffice'), value: Math.round(revenue / 1_000_000),
      prefix: '$', suffix: 'M', percent: toPercent(revenue, 2_000_000_000) });

  if (stats.length === 0 && !(trakt?.comments?.length)) return null;

  return (
    <section ref={sectionRef} className="mb-[40px]">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">
        {t('detail.inNumbers')}
      </h2>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <StatCard key={s.label} stat={s} active={isVisible} />
          ))}
        </div>
      )}

      {trakt?.comments && trakt.comments.length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold text-white/30 uppercase tracking-widest mb-4">
            {t('detail.traktReviews')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trakt.comments.map((c: TraktCommentData) => (
              <ReviewCard key={c.id} review={c} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
