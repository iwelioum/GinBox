import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck, CreditCard, HardDrive, Play, Radio, Zap,
} from 'lucide-react';
import { PROVIDER_DISPLAY } from '../catalogFilterConstants';
import type {
  AvailabilitySource,
  EnrichedItem,
  FilterSectionProps,
} from '../catalogFilterTypes';

interface AvailabilityFilterProps extends FilterSectionProps {
  availabilityItems: EnrichedItem[];
  allItems: EnrichedItem[];
}

export const AvailabilityFilter: React.FC<AvailabilityFilterProps> = ({
  availabilityItems, allItems, filters, onChange,
}) => {
  const { t } = useTranslation();

  const hasData = React.useMemo(
    () => allItems.some((i) => i._isLocal || i._isDebrid || i._providers.length > 0),
    [allItems],
  );

  const availableProviders = React.useMemo(() => {
    const counts = new Map<string, { nameKey: string; flag: string; color: string; count: number }>();
    for (const item of availabilityItems) {
      for (const p of item._providers) {
        if (!counts.has(p.id)) {
          const meta = PROVIDER_DISPLAY[p.id];
          counts.set(p.id, {
            nameKey: meta?.nameKey ?? p.name,
            flag:    meta?.flag    ?? 'INTL',
            color:   meta?.color   ?? '#888888',
            count:   0,
          });
        }
        counts.get(p.id)!.count++;
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, meta]) => ({ id, ...meta }));
  }, [availabilityItems]);

  if (!hasData) return null;

  const toggleAvailSource = (s: AvailabilitySource) =>
    onChange({
      ...filters,
      availSources: filters.availSources.includes(s)
        ? filters.availSources.filter((x) => x !== s)
        : [...filters.availSources, s],
    });

  const toggleProvider = (id: string) =>
    onChange({
      ...filters,
      selectedProviders: filters.selectedProviders.includes(id)
        ? filters.selectedProviders.filter((x) => x !== id)
        : [...filters.selectedProviders, id],
    });

  const sources: { value: AvailabilitySource; labelKey: string; icon: typeof HardDrive; count: number }[] = [
    { value: 'local',     labelKey: 'filters.sourceLibrary',     icon: HardDrive, count: availabilityItems.filter((i) => i._isLocal).length },
    { value: 'debrid',    labelKey: 'filters.sourceDebridCache', icon: Zap,       count: availabilityItems.filter((i) => i._isDebrid).length },
    { value: 'streaming', labelKey: 'filters.sourceStreaming',   icon: Radio,     count: availabilityItems.filter((i) => i._providers.length > 0).length },
  ];

  const accessTypes = [
    { value: 'all'      as const, labelKey: 'common.all',                   icon: undefined   },
    { value: 'sub'      as const, labelKey: 'filters.accessSubscription',   icon: BadgeCheck   },
    { value: 'rent_buy' as const, labelKey: 'filters.accessRentalPurchase', icon: CreditCard   },
  ] as const;

  return (
    <section>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        {t('filters.availability')}
      </h3>

      <button
        onClick={() => onChange({ ...filters, watchableNow: !filters.watchableNow })}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm mb-5 ${
          filters.watchableNow
            ? 'bg-green-600/20 border-green-500 text-green-400 font-medium'
            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
        }`}
      >
        <span className="flex items-center gap-2">
          <Play size={14} />
          <span>{t('filters.watchableNow')}</span>
        </span>
        <span className="text-[10px] opacity-60">{t('filters.watchableNowSub')}</span>
      </button>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
          {t('filters.sourceLabel')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sources.map(({ value, labelKey, icon: SourceIcon, count }) => {
            const active = filters.availSources.includes(value);
            return (
              <button key={value} onClick={() => toggleAvailSource(value)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                <SourceIcon size={12} />
                <span>{t(labelKey)}</span>
                <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {(filters.availSources.includes('streaming') || filters.availSources.length === 0) && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.accessType')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {accessTypes.map(({ value, labelKey, icon: AccessIcon }) => (
              <button key={value} onClick={() => onChange({ ...filters, streamingType: value })}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  filters.streamingType === value ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                {AccessIcon ? <AccessIcon size={12} /> : null}
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableProviders.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.platform')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableProviders.map(({ id, nameKey, flag, color, count }) => {
              const active = filters.selectedProviders.includes(id);
              return (
                <button key={id} onClick={() => toggleProvider(id)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all duration-150 ${
                    active ? 'text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:border-white/25'
                  }`}
                  style={active ? { backgroundColor: color + '33', borderColor: color } : {}}
                >
                  <span>{flag}</span>
                  <span>{t(nameKey)}</span>
                  <span className={`font-mono text-[10px] ${active ? 'text-white/50' : 'text-white/30'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
