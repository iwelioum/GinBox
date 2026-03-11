// MyListsPage.tsx — Role: Displays user lists
// RULES: List selection + items rendering

import { useState, useEffect }                        from 'react'
import { useTranslation }                             from 'react-i18next'
import { motion }                                     from 'framer-motion'
import { useLists, useListItems, useRemoveFromList }  from '../../../shared/hooks/useLists'
import { ContentCard }                                from './ContentCard'
import { Skeleton }                                   from '@/shared/components/ui'
import { EmptyState }                                 from '@/shared/components/ui/EmptyState'
import { Heart, List }                                from 'lucide-react'
import type { UserList, ListItem, CatalogMeta }       from '../../../shared/types/index'

export default function MyListsPage() {
  const { t } = useTranslation()
  const { data: lists = [] } = useLists()
  const removeFromList = useRemoveFromList()

  // Select the first list on load
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (lists.length > 0 && selectedListId === null) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  const activeList = lists.find((l) => l.id === selectedListId)

  const { data: items = [], isLoading: itemsLoading } = useListItems(selectedListId)

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        padding: 'calc(var(--titlebar-height) + var(--navbar-height) + 2rem) var(--section-px) 2rem',
      }}
    >

      {/* Page title */}
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-6 tracking-tight">
        {t('lists.heading')}
      </h1>

      {/* Empty state when no lists exist at all */}
      {lists.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title={t('lists.noLists')}
          description={t('lists.addFromDetail')}
          className="py-32"
        />
      ) : (
        <>
          {/* List selector — pill tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {lists.map((list: UserList) => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="px-5 py-1.5 rounded-full border-none cursor-pointer text-[0.9rem] transition-colors duration-150"
                style={{
                  background: list.id === selectedListId
                    ? 'var(--color-accent)'
                    : 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
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
            <EmptyState
              icon={<List />}
              title={activeList ? t('lists.listEmpty', { name: activeList.name }) : t('lists.noLists')}
              description={t('lists.addFromDetail')}
            />
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
                  description: '',
                }
                return (
                  <div
                    key={item.contentId}
                    className="relative"
                    onMouseEnter={() => setHoveredId(item.contentId)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <ContentCard
                      item={meta}
                      variant="poster"
                    />
                    {hoveredId === item.contentId && (
                      <button
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.70)',
                          color: '#ffffff',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,79,79,0.80)'
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.70)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromList.mutate({
                            listId: selectedListId!,
                            contentId: item.contentId,
                          })
                        }}
                        title={t('lists.removeItem')}
                        aria-label={t('lists.removeItem')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
