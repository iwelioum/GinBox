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
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
        {t('filters.contentType')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {CONTENT_KINDS.map(({ kind, label }) => {
          const count  = kindCounts[kind] ?? 0;
          const active = filters.kinds.includes(kind);
          const KindIcon = KIND_ICONS[kind] ?? Clapperboard;
          if (count === 0) return null;
          return (
            <button key={kind} onClick={() => toggleKind(kind)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-center transition-all duration-150 border ${
                active ? 'bg-white text-black border-white font-semibold' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
              }`}
            >
              <KindIcon size={16} strokeWidth={2.2} />
              <span className="text-[10px] leading-tight">{label}</span>
              <span className={`text-[9px] font-mono ${active ? 'text-black/50' : 'text-white/25'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
