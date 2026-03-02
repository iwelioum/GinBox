// MyListsPage.tsx — Rôle: Affiche les listes de l'utilisateur
// RÈGLES : Sélection liste + rendu items

import { useState, useEffect }           from 'react'
import { motion }                        from 'framer-motion'
import { useLists, useListItems }        from '../../../shared/hooks/useLists'
import { ContentCard }                   from './ContentCard'
import type { UserList, ListItem, CatalogMeta } from '../../../shared/types/index'

export default function MyListsPage() {
  const { data: lists = [] } = useLists()

  // Sélectionner la première liste au chargement
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

      {/* Titre page */}
      <h1 style={{
        fontSize:      'clamp(1.5rem, 3vw, 2rem)',
        fontWeight:    700,
        marginBottom:  '1.5rem',
        letterSpacing: '-0.02em',
      }}>
        Mes listes
      </h1>

      {/* Sélecteur de liste — onglets pills */}
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

      {/* Contenu de la liste sélectionnée */}
      {itemsLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
      ) : items.length === 0 ? (
        <div style={{
          padding:   '4rem',
          textAlign: 'center',
          color:     'var(--color-text-muted)',
        }}>
          <p style={{ fontSize: '1.1rem' }}>
            {activeList ? `"${activeList.name}" est vide.` : 'Aucune liste.'}
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ajoutez des contenus depuis la page de détails.
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
