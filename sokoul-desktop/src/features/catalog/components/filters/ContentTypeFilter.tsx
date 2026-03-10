import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CONTENT_KINDS, type ContentKind } from '@/shared/utils/contentKind';
import { Clapperboard } from 'lucide-react';
import { KIND_ICONS } from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface ContentTypeFilterProps extends FilterSectionProps {
  allItems: EnrichedItem[];
}

export const ContentTypeFilter: React.FC<ContentTypeFilterProps> = ({
  allItems, filters, onChange,
}) => {
  const { t } = useTranslation();

  const kindCounts = React.useMemo(() => {
    const counts: Partial<Record<ContentKind, number>> = {};
    for (const item of allItems) counts[item._kind] = (counts[item._kind] ?? 0) + 1;
    return counts;
  }, [allItems]);

  const toggleKind = (k: ContentKind) =>
    onChange({
      ...filters,
      kinds: filters.kinds.includes(k)
        ? filters.kinds.filter((x) => x !== k)
        : [...filters.kinds, k],
    });

  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.contentType')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {CONTENT_KINDS.map(({ kind, labelKey }) => {
          const count  = kindCounts[kind] ?? 0;
          const active = filters.kinds.includes(kind);
          const KindIcon = KIND_ICONS[kind] ?? Clapperboard;
          if (count === 0) return null;
          return (
            <button key={kind} onClick={() => toggleKind(kind)}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg text-center transition-all duration-200 border ${
                active
                  ? 'bg-accent text-white border-accent font-semibold'
                  : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <KindIcon size={16} strokeWidth={2.2} />
              <span className="text-xs leading-tight font-medium">{t(labelKey)}</span>
              <span className={`text-xs font-mono ${active ? 'text-white/70' : 'text-text-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
