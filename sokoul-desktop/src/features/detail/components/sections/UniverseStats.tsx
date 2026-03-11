import { useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { GlassPanel } from '@/shared/components/ui';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

interface StatItem {
  icon: string;
  value: number;
  label: string;
  suffix?: string;
}

function CountUp({ target, suffix }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) { setDisplayed(target); return; }
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target, prefersReducedMotion]);

  return (
    <span ref={ref} className="text-4xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
      {target % 1 !== 0 ? displayed.toFixed(1) : displayed}{suffix}
    </span>
  );
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function UniverseStats({ data }: { data: UseDetailDataResult }) {
  const { item, isSeries } = data;

  const stats = useMemo(() => {
    if (!item) return [];
    const s: StatItem[] = [];
    if (item.vote_average != null) s.push({ icon: '⭐', value: item.vote_average, label: 'Rating', suffix: '/10' });
    if (isSeries && item.number_of_seasons) s.push({ icon: '📺', value: item.number_of_seasons, label: 'Seasons' });
    if (isSeries && item.number_of_episodes) s.push({ icon: '🎬', value: item.number_of_episodes, label: 'Episodes' });
    if (!isSeries && item.runtime) s.push({ icon: '⏱', value: item.runtime, label: 'Minutes' });
    if (item.vote_count) s.push({ icon: '👥', value: item.vote_count, label: 'Votes' });
    if (item.popularity) s.push({ icon: '📈', value: Math.round(item.popularity), label: 'Popularity' });
    return s;
  }, [item, isSeries]);

  if (stats.length === 0) return null;

  return (
    <section className="relative px-16 py-8">
      <div className="section-atmosphere" />
      <motion.div
        className="relative z-10 flex gap-4 overflow-x-auto scrollbar-hide"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <GlassPanel className="px-6 py-6 min-w-[140px] flex-shrink-0 text-center">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <CountUp target={stat.value} suffix={stat.suffix} />
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{stat.label}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
