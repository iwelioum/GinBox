import type { Dispatch, SetStateAction } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatCacheAge, FILTER_GROUPS, SORT_LABELS, type SortKey } from './sourceUtils';

interface SourcesSidebarProps {
  sortBy: SortKey;
  setSortBy: (key: SortKey) => void;
  activeFilters: Set<string>;
  setActiveFilters: Dispatch<SetStateAction<Set<string>>>;
  toggleFilter: (tag: string) => void;
  cachedAt: number | null;
  isStale: boolean;
  onForceRefresh: () => void;
}

export function SourcesSidebar({
  sortBy, setSortBy, activeFilters, setActiveFilters, toggleFilter,
  cachedAt, isStale, onForceRefresh,
}: SourcesSidebarProps) {
  return (
    <aside style={{
      width: 210, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: '20px 14px', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 20,
      scrollbarWidth: 'none',
    }}>
      {/* Sort by */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', marginBottom: 8, margin: '0 0 8px 2px' }}>
          Sort by
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SORT_LABELS.map(([key, label]) => (
            <button
              key={key} onClick={() => setSortBy(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none',
                background: sortBy === key ? 'rgba(255,255,255,0.09)' : 'transparent',
                color: sortBy === key ? 'rgba(249,249,249,0.92)' : 'rgba(249,249,249,0.38)',
                fontSize: 12, fontWeight: sortBy === key ? 700 : 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s ease',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: sortBy === key ? '#4361ee' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.12s',
              }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Filter groups */}
      {FILTER_GROUPS.map(group => {
        const groupActive = [...activeFilters].some(t => (group.tags as readonly string[]).includes(t));
        return (
          <div key={group.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
                {group.label}
              </p>
              {groupActive && (
                <button
                  onClick={() => setActiveFilters(prev => {
                    const next = new Set(prev);
                    for (const t of group.tags) next.delete(t);
                    return next;
                  })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 9, padding: '1px 3px' }}
                >✕</button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {group.tags.map(tag => {
                const on = activeFilters.has(tag);
                return (
                  <button
                    key={tag} onClick={() => toggleFilter(tag)}
                    style={{
                      padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                      border:     on ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.07)',
                      background: on ? 'rgba(255,255,255,0.10)'           : 'rgba(255,255,255,0.02)',
                      color:      on ? 'rgba(249,249,249,0.92)'           : 'rgba(249,249,249,0.35)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', whiteSpace: 'nowrap', transition: 'all 0.12s ease',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Clear + Cache + Refresh */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'underline', textAlign: 'left', padding: 0 }}
          >
            Clear all filters
          </button>
        )}
        {cachedAt && (
          <p style={{ fontSize: 10, color: isStale ? '#fbbf24' : 'rgba(255,255,255,0.22)', margin: 0, lineHeight: 1.4 }}>
            {isStale ? 'Outdated results' : `Updated ${formatCacheAge(cachedAt)}`}
          </p>
        )}
        <button
          onClick={onForceRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(249,249,249,0.55)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s ease',
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </aside>
  );
}
