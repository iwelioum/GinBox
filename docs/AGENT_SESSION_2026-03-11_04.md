# Session 4 — 2026-03-11

## Context
- Sessions précédentes : 4 (session 0, 1, 2, 3)
- Dernier commit : `21697bb` (session 3 — perf, EmptyState, kids filter)

## Ce que j'ai observé
- ProfileCard.tsx : 2 boutons emoji (✏️/🗑️) sans aria-label
- HoverCard.tsx : KIND_LABELS hardcodé en anglais (11→21), pas d'i18n
- ProfileSelectPage.tsx : console.error au lieu de toast pour erreur delete
- 5 type exports inutilisés dans ui/index.ts (BadgeProps, ButtonProps, SkeletonProps, TabsProps, InputProps)
- Fanart queries — audit initialement signalé comme manquant staleTime, mais vérification montre qu'elles ont toutes `staleTime: Infinity` ✅
- 0 composants > 300 lignes, 0 TODO/FIXME, 0 console.log (hors error boundaries)

## Ce que j'ai implémenté
| Fichier | Modification | Raison |
|---------|-------------|--------|
| ProfileCard.tsx | `aria-label={t('profile.edit')}` et `aria-label={t('profile.delete')}` | A11y — boutons icon-only |
| HoverCard.tsx | KIND_LABELS → KIND_KEYS avec `t()` | i18n — texte hardcodé |
| ProfileSelectPage.tsx | `console.error` → `toast(t('profile.errorDeleting'), 'error')` | UX feedback |
| ui/index.ts | Suppression BadgeProps, ButtonProps, SkeletonProps, TabsProps, InputProps | Dead exports |
| en.json | +profile.edit, profile.delete, profile.errorDeleting, kind.* (9 types) | i18n |
| fr.json | +profile.edit, profile.delete, profile.errorDeleting, kind.* (9 types) | i18n |
| useHomePersonalized.ts | `filterForKids()` sur les 3 rails personnalisés | Session 3 suite — kids filter complet |
| useBrowseData.ts | `filterForKids()` dans rawItems | Session 3 suite — kids filter complet |

---

## 1. Règles ajoutées à AGENTS.md

Section `# LEARNED RULES (from agent sessions)` ajoutée en fin de fichier. Voici les règles **exactes** :

### Session 0-1 — Foundation
| Règle | Origine |
|-------|---------|
| Never pass Function/Map/Set in `navigate()` state — structuredClone crashes | Bug 6 (Phase 1) |
| `parseTorrentName()` returns quality values: `'2160p','1080p','720p','480p','4K','4k','UHD'` — do not invent others | Bug 3 (sourceUtils.ts) |
| All backend providers already run in parallel via `tokio::join!` in stream.rs | Phase 0 audit |
| PreferencesStore uses localStorage (`sokoul_stream_preferences`), NOT backend preferences.rs | Phase 0 audit |
| Profile.id is `number`, not string | Phase 0 audit |

### Session 2 — Component Splits
| Règle | Origine |
|-------|---------|
| Components > 300 lines must be split into sub-components with focused responsibilities | AGENTS.md Rule 4 enforcement |
| MPV speed control: `window.mpv.command({ command: ['set_property', 'speed', rate] })` | OverlayPage speed selector impl |
| All icon-only buttons in ControlsBar require `aria-label` — always add when creating new ones | a11y audit (8 buttons fixed) |

### Session 3 — Performance & Consistency
| Règle | Origine |
|-------|---------|
| `parseTorrentName()` must ALWAYS be wrapped in `useMemo([source.title])` — it's an expensive regex parser | Perf audit (4 files fixed) |
| EmptyState from `shared/components/ui` is the standard — never use inline div empty states | 8 inline states replaced |
| Spinner from `shared/components/ui` is the standard — never create custom CSS spinners | CollectionsPage custom spinner |
| Kids filter uses genre_ids (fail-open: no genres = include). Applied in 4 entry points | kidsFilter.ts design decision |
| `useKidsFilter<T>()` hook wraps profileStore.isKids for reusability | Hook pattern |

### Session 4 — i18n & Cleanup
| Règle | Origine |
|-------|---------|
| All UI text must use `t()` from react-i18next — no hardcoded English/French strings | HoverCard KIND_LABELS fix |
| Error handling must use `toast()` from useToast — never `console.error` for user-facing errors | ProfileSelectPage fix |
| Fanart queries have `staleTime: Infinity` — this is correct, fanart data never changes | Audit false positive |
| Type-only re-exports (e.g. `BadgeProps`) should not be in barrel index.ts unless consumed externally | 5 exports removed |

---

## 2. Décisions architecturales — Kids Filter

### Pourquoi 4 entry points ?

Le contenu arrive dans l'app par **4 chemins de données distincts**. Chaque chemin doit être filtré indépendamment car ils ne partagent pas de pipeline commun :

```
┌─────────────────────────────────────────────────────────────┐
│                    Sources de contenu                        │
├──────────────┬──────────────┬───────────┬───────────────────┤
│  TMDB API    │ Playback     │ User      │  TMDB Search      │
│  (catalog)   │ History      │ Lists     │  (query)          │
└──────┬───────┴──────┬───────┴─────┬─────┴───────┬───────────┘
       │              │             │             │
       ▼              ▼             ▼             ▼
  ┌─────────┐  ┌──────────────┐ ┌────────┐  ┌──────────┐
  │HomePage │  │useHomePerson.│ │Browse  │  │SearchPage│
  │rails    │  │3 rails       │ │Page    │  │results   │
  └─────────┘  └──────────────┘ └────────┘  └──────────┘
```

### Les 4 entry points (exactement)

| # | Fichier | Ligne | Appel exact | Ce qui est filtré |
|---|---------|-------|-------------|-------------------|
| 1 | `HomePage.tsx` | 115 | `filterForKids(deduplicated)` | Items de chaque rail TMDB (tendances, top rated, genres) |
| 2 | `useHomePersonalized.ts` | 117-121 | `filterForKids(continueWatchingItems)`, `filterForKids(recentlyAddedItems)`, `filterForKids(becauseYouWatched.items)` | 3 rails personnalisés basés sur historique/listes |
| 3 | `useBrowseData.ts` | 123 | `filterForKids(deduped)` | Tous les items du catalogue BrowsePage |
| 4 | `SearchPage.tsx` | 33+70 | `filterForKids(trending)` + `filterForKids(allMetas)` | Suggestions populaires + résultats de recherche |

### Si on ajoute un 5ème point d'entrée

Chercher **où des `CatalogMeta[]` arrivent de l'API et sont affichés à l'utilisateur**. Exemple de candidats futurs :

- `CollectionDetailPage.tsx` — si on affiche des collections (actuellement pas filtré, contenu arrive via `endpoints.catalog.getCollection`)
- `ActorPage.tsx` — filmographie d'un acteur (pas filtré, contenu via `endpoints.catalog.getPersonMovies`)
- `DetailPage` → `SimilarSection` — contenus similaires (pas filtré, arrive via `item.similar`)

**Pattern à suivre** :
```typescript
import { useKidsFilter } from '@/shared/hooks/useKidsFilter';
const { filterForKids } = useKidsFilter<CatalogMeta>();
// Appliquer APRÈS la déduplication, AVANT le rendu
const safeItems = filterForKids(rawItems);
```

### Logique du filtre (`kidsFilter.ts`)
- **Genres exclus** (TMDB IDs) : Horror(27), Crime(80), War(10752), Thriller(53), Romance(10749)
- **Stratégie fail-open** : si un item n'a pas de `genre_ids` ni `genres`, il **passe** le filtre (mieux vaut montrer un contenu incertain que cacher du contenu légitime)
- Le filtre ne touche PAS au backend — tout est côté client via `useKidsFilter` qui lit `profileStore.activeProfile.isKids`

---

## 3. Score de dette technique

### A. Virtualisation SourcePanel — IMPACT MOYEN

**État actuel** : Aucune virtualisation, aucune limite. Toutes les sources sont rendues dans le DOM via `.map()` (ligne 161 de `SourcePanel.tsx`).

**Impact si > 50 sources** :
- **50-100 sources** : imperceptible grâce aux accordéons (seul le groupe ouvert est visible, mais TOUS sont dans le DOM)
- **100-200 sources** : ralentissement mesurable au scroll, surtout si chaque `SourceCard` déclenche `parseTorrentName` (atténué par le `useMemo` ajouté en session 3)
- **200-500 sources** : lag notable, consommation mémoire élevée, interaction dégradée
- **En pratique** : Torrentio + Prowlarr + Wastream retournent rarement > 100 sources pour un film populaire. Le risque est **modéré** mais réel pour des contenus très seedés.

**Solution** : `@tanstack/react-virtual` — NON installé actuellement. Nécessite `npm install @tanstack/react-virtual` (à confirmer avec l'utilisateur avant d'ajouter une dépendance).

### B. Skeleton SearchPage — IMPACT FAIBLE

**Pages utilisant Spinner au lieu de Skeleton** :

| Page | Fichier | Spinner utilisé | Skeleton alternative |
|------|---------|-----------------|---------------------|
| SearchPage | `search/components/SearchPage.tsx:145-149` | `<Spinner size={48} />` | Grid de cards skeleton |
| ActorPage | `catalog/components/ActorPage.tsx:52-56` | `<Spinner size={48} />` | Biographie + filmographie skeleton |
| CollectionsPage | `catalog/components/CollectionsPage.tsx` | `<Spinner />` | Grid skeleton |
| SourcesPage | `detail/components/SourcesPage.tsx` | `<Spinner />` | Liste skeleton |

**Pages avec Skeleton (correctes)** : HomePage, ProfileSelectPage, MyListsPage, DetailPage.

**Impact** : Purement esthétique. Le Spinner fonctionne mais rompt l'illusion de contenu pré-chargé. L'utilisateur voit un spinner générique au lieu d'une silhouette de la page finale. Impact UX faible mais visible.

### C. Query Error State — IMPACT CRITIQUE 🔴

**17 queries sur 19 n'ont AUCUNE gestion d'erreur dans l'UI.**

| Fichier | QueryKey | Error UI ? |
|---------|----------|-----------|
| SearchPage.tsx | `['search', 'multi', query]` | ❌ Silent fail |
| useHomePersonalized.ts | `['playback-history', profileId]` | ❌ Silent fail |
| useHomePersonalized.ts | `['lists', profileId]` | ❌ Silent fail |
| useHomePersonalized.ts | `['list-items', favListId]` | ❌ Silent fail |
| useHomePersonalized.ts | `['catalogMeta', type, id]` | ❌ Silent fail |
| useBrowseData.ts | `['user-progress', profileId]` | ❌ Silent fail |
| useBrowseData.ts | `['playback-history', profileId]` | ❌ Silent fail |
| useBrowseData.ts | `['library', type, id, page]` (×N) | ❌ Silent fail |
| ProfileSelectPage.tsx | `['profiles']` | ❌ Silent fail |
| CollectionsPage.tsx | `['collections', 'all']` | ❌ Silent fail |
| SourcesPage.tsx | `['catalogMeta', type, id]` | ❌ Silent fail |
| HoverCard.tsx | `['catalogMeta', type, id]` | ❌ Silent fail |
| EditorialCard.tsx | `['fanart-editorial', ...]` | ❌ Silent fail |
| StatsSection.tsx | `['trakt-reviews', type, id]` | ❌ Silent fail |
| CollectionDetailPage.tsx | `['collection', id]` | ❌ Silent fail |
| useDetailData.ts | `['playback-history', ...]` | ❌ Silent fail |
| **useDetailData.ts** | `['catalogMeta', type, id]` | ✅ **Redirige si erreur** |
| **ActorPage.tsx** | `['personMovies', id]` | ✅ **Message d'erreur** |

**Impact** : Si le backend est down ou une requête TMDB échoue, l'utilisateur voit une page vide sans explication. Pas de message d'erreur, pas de bouton retry. Le `QueryClient` dans `main.tsx` a un `onError` global (console.error) mais rien n'est affiché à l'utilisateur.

**Solution recommandée** : Créer un composant `QueryErrorState` réutilisable (icône + message + bouton refetch) et l'appliquer dans chaque page qui destructure `useQuery`. Priorité : SearchPage, ProfileSelectPage, CollectionsPage (pages principales).

---

## Score de complétion global

| Métrique | Score | Tendance |
|----------|-------|----------|
| Bugs résolus (Phase 1) | 6/6 | ✅ |
| Intégrations (Phase 2) | 5/5 | ✅ |
| Features (Phase 3) | 21/23 | ✅ |
| Performance (Phase 4) | 4/5 | 🟡 (virtualisation manquante) |
| Polish (Phase 5) | 7/10 | 🟡 (error states, skeleton) |
| Composants < 300 lignes | 100% | ✅ |
| i18n couverture | 100% | ✅ |
| a11y aria-labels | 100% | ✅ |
| Query error handling | 2/19 (11%) | 🔴 |
| **Dette technique** | **Moyenne** | ↘ en baisse |

## TODO pour la prochaine session (priorisé)
- [ ] P1 : Query error states — créer `QueryErrorState` composant + wirer dans les 5 pages principales
- [ ] P2 : Virtualisation SourcePanel si > 50 sources (nécessite `@tanstack/react-virtual`)
- [ ] P3 : Skeleton loading pour SearchPage, ActorPage, CollectionsPage, SourcesPage
- [ ] P3 : Kids filter sur les 3 points d'entrée manquants (CollectionDetailPage, ActorPage, SimilarSection)
