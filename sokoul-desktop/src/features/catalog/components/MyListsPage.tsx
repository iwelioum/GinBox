// MyListsPage.tsx — Role: Displays user lists
// RULES: List selection + items rendering

import { useState, useEffect }           from 'react'
import { useTranslation }                from 'react-i18next'
import { motion }                        from 'framer-motion'
import { useLists, useListItems }        from '../../../shared/hooks/useLists'
import { ContentCard }                   from './ContentCard'
import type { UserList, ListItem, CatalogMeta } from '../../../shared/types/index'

export default function MyListsPage() {
  const { t } = useTranslation()
  const { data: lists = [] } = useLists()

  // Select the first list on load
  const [selectedListId, setSelectedListId] = useState<number | null>(null)

  useEffect(() => {
    if (lists.length > 0 && selectedListId === null) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  const activeList = lists.find((l) => l.id === selectedListId)

  const { data: items = [], isLoading: itemsLoading } = useListItems(selectedListId)

  return (
    <div style={{
      minHeight:  '100vh',
      background: 'var(--color-bg-primary)',
      padding:    'calc(var(--titlebar-height) + var(--navbar-height) + 2rem) var(--section-px) 2rem',
      fontFamily: 'var(--font-main)',
      color: 'var(--color-text-primary)'
    }}>

      {/* Page title */}
      <h1 style={{
        fontSize:      'clamp(1.5rem, 3vw, 2rem)',
        fontWeight:    700,
        marginBottom:  '1.5rem',
        letterSpacing: '-0.02em',
      }}>
        {t('lists.heading')}
      </h1>

      {/* List selector — pill tabs */}
      <div style={{
        display:      'flex',
        gap:          '0.5rem',
        flexWrap:     'wrap',
        marginBottom: '2rem',
      }}>
        {lists.map((list: UserList) => (
          <button
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            style={{
              padding:       '0.4rem 1.25rem',
              borderRadius:  'var(--radius-pill)',
              border:        'none',
              background:    list.id === selectedListId
                ? 'var(--color-accent)'
                : 'var(--color-bg-card)',
              color:         'var(--color-text-primary)',
              cursor:        'pointer',
              fontSize:      '0.9rem',
              fontWeight:    list.id === selectedListId ? 600 : 400,
              transition:    'background 150ms',
            }}
          >
            {list.name}
          </button>
        ))}
      </div>

      {/* Selected list content */}
      {itemsLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('lists.loading')}</p>
      ) : items.length === 0 ? (
        <div style={{
          padding:   '4rem',
          textAlign: 'center',
          color:     'var(--color-text-muted)',
        }}>
          <p style={{ fontSize: '1.1rem' }}>
            {activeList ? t('lists.listEmpty', { name: activeList.name }) : t('lists.noLists')}
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {t('lists.addFromDetail')}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
            gap:                 '1.25rem',
          }}
        >
          {items.map((item: ListItem) => {
            const meta: CatalogMeta = {
              id:          item.contentId,
              type:        item.contentType,
              name:        item.title,
              poster:      item.posterUrl,
              background:  item.backdropUrl,
              description: '',
              year:        item.year,
              imdbRating:  item.rating,
            }
            return (
              <ContentCard
                key={item.contentId}
                item={meta}
                variant="poster"
              />
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
