// MyListsPage.tsx — Role: Displays user lists
// RULES: List selection + items rendering

import { useState, useEffect }           from 'react'
import { useTranslation }                from 'react-i18next'
import { motion }                        from 'framer-motion'
import { useLists, useListItems }        from '../../../shared/hooks/useLists'
import { ContentCard }                   from './ContentCard'
import { Skeleton }                          from '@/shared/components/ui'
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
    <div
      className="min-h-screen bg-[var(--color-bg-primary)] font-sans text-dp-text"
      style={{ padding: 'calc(var(--titlebar-height) + var(--navbar-height) + 2rem) var(--section-px) 2rem' }}
    >

      {/* Page title */}
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-6 tracking-tight">
        {t('lists.heading')}
      </h1>

      {/* List selector — pill tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {lists.map((list: UserList) => (
          <button
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            className="px-5 py-1.5 rounded-full border-none text-dp-text cursor-pointer text-[0.9rem] transition-colors duration-150"
            style={{
              background: list.id === selectedListId
                ? 'var(--color-accent)'
                : 'var(--color-bg-card)',
              fontWeight: list.id === selectedListId ? 600 : 400,
            }}
          >
            {list.name}
          </button>
        ))}
      </div>

      {/* Selected list content */}
      {itemsLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-5">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center text-[var(--color-text-muted)]">
          <p className="text-[1.1rem]">
            {activeList ? t('lists.listEmpty', { name: activeList.name }) : t('lists.noLists')}
          </p>
          <p className="text-[0.85rem] mt-2">
            {t('lists.addFromDetail')}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-5"
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
