import { useMemo } from 'react';
import { SectionHeader } from '@/shared/components/ui';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function ProductionDetails({ data }: { data: UseDetailDataResult }) {
  const { item } = data;

  const fields = useMemo(() => {
    if (!item) return [];
    const f: { label: string; value: string }[] = [];
    if (item.director) f.push({ label: 'Director', value: item.director });
    if (item.studio) f.push({ label: 'Studio', value: item.studio });
    if (item.status) f.push({ label: 'Status', value: item.status });
    if (item.original_language) f.push({ label: 'Language', value: item.original_language.toUpperCase() });
    if (item.origin_country?.length) f.push({ label: 'Country', value: item.origin_country.join(', ') });
    if (item.budget && item.budget > 0) f.push({ label: 'Budget', value: formatCurrency(item.budget) });
    if (item.revenue && item.revenue > 0) f.push({ label: 'Revenue', value: formatCurrency(item.revenue) });
    if (item.runtime) f.push({ label: 'Runtime', value: `${item.runtime} minutes` });
    if (item.release_date) f.push({ label: 'Release', value: new Date(item.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
    return f;
  }, [item]);

  if (fields.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="Production" />
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-4">
          {fields.map(f => (
            <div key={f.label} className="flex items-baseline gap-4">
              <dt className="text-sm text-[var(--color-text-muted)] w-24 flex-shrink-0">{f.label}</dt>
              <dd className="text-sm font-medium text-[var(--color-text-primary)]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
