import { useMemo } from 'react';
import { SectionHeader, GlassPanel } from '@/shared/components/ui';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

interface FieldGroup {
  title: string;
  icon: string;
  fields: { label: string; value: string }[];
}

export function ProductionDetails({ data }: { data: UseDetailDataResult }) {
  const { item } = data;

  const groups = useMemo(() => {
    if (!item) return [];
    const g: FieldGroup[] = [];

    const creative: { label: string; value: string }[] = [];
    if (item.director) creative.push({ label: 'Director', value: item.director });
    if (item.studio) creative.push({ label: 'Studio', value: item.studio });
    if (item.status) creative.push({ label: 'Status', value: item.status });
    if (creative.length > 0) g.push({ title: 'Creative', icon: '🎬', fields: creative });

    const tech: { label: string; value: string }[] = [];
    if (item.original_language) tech.push({ label: 'Language', value: item.original_language.toUpperCase() });
    if (item.origin_country?.length) tech.push({ label: 'Country', value: item.origin_country.join(', ') });
    if (item.runtime) tech.push({ label: 'Runtime', value: `${item.runtime} minutes` });
    if (item.release_date) tech.push({ label: 'Release', value: new Date(item.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
    if (tech.length > 0) g.push({ title: 'Technical', icon: '📋', fields: tech });

    const financial: { label: string; value: string }[] = [];
    if (item.budget && item.budget > 0) financial.push({ label: 'Budget', value: formatCurrency(item.budget) });
    if (item.revenue && item.revenue > 0) financial.push({ label: 'Revenue', value: formatCurrency(item.revenue) });
    if (item.revenue && item.budget && item.budget > 0) {
      const roi = ((item.revenue - item.budget) / item.budget * 100).toFixed(0);
      financial.push({ label: 'ROI', value: `${Number(roi) > 0 ? '+' : ''}${roi}%` });
    }
    if (financial.length > 0) g.push({ title: 'Financial', icon: '💰', fields: financial });

    return g;
  }, [item]);

  if (groups.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="Production" subtitle="Behind the numbers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <GlassPanel key={group.title} className="p-6 card-glow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">{group.title}</h3>
              </div>
              <dl className="space-y-3">
                {group.fields.map(f => (
                  <div key={f.label} className="flex items-baseline justify-between gap-4 group/row">
                    <dt className="text-sm text-[var(--color-text-muted)] group-hover/row:text-[var(--color-text-secondary)] transition-colors">{f.label}</dt>
                    <dd className="text-sm font-medium text-[var(--color-text-primary)] text-right">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
