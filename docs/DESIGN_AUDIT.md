# SOKOUL — AUDIT DESIGN COMPLET (READ-ONLY)

## 1. DESIGN SYSTEM ACTUEL

### Identité visuelle
- **Thème** : Clone Disney+ dark (`#040714` bg, `#f9f9f9` text, `#090b13` nav)
- **Framework CSS** : Tailwind CSS v3.4 + CSS variables + inline styles
- **Animations** : Framer Motion v11.3 + CSS keyframes
- **Icônes** : Lucide React v0.575
- **Typographie** : `Avenir-Roman → Inter → system sans-serif`
- **Tokens CSS** : 3 fichiers (`globals.css`, `animations.css`, `player.tokens.css`)

### Composants UI partagés (8 total)
| Composant | LOC | Rôle |
|-----------|-----|------|
| Button | 35 | 3 variantes (primary/secondary/ghost) |
| Spinner | 31 | SVG animé |
| ErrorBoundary | 55 | Fallback d'erreur |
| LoadingFallback | 8 | Plein écran pour lazy routes |
| Layout | 18 | TitleBar + Navbar + Outlet |
| Navbar | 151 | Glassmorphism Disney+ |
| TitleBar | 55 | Electron window controls |
| ResumeModal | 71 | Dialogue reprendre/recommencer |

---

## 2. AUDIT PAR PAGE — ÉTAT ACTUEL + PROPOSITIONS

---

### PAGE 1 : ProfileSelectPage (331 LOC)

**État actuel :**
- ✅ Framer Motion hover/tap sur les cartes profil
- ✅ i18n complet
- ✅ Formulaire modal avec glassmorphism + spring animation
- ⚠️ **BUG CRITIQUE** : Utilise `var(--color-bg-primary)`, `var(--color-accent)`, `var(--radius-card)`, `var(--radius-pill)`, `var(--font-main)`, `var(--color-bg-glass)`, `var(--color-bg-overlay)`, `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-muted)`, `var(--color-bg-card)`, `var(--radius-button)`, `var(--radius-modal)` — **AUCUNE de ces variables n'est définie dans les CSS**. Les vraies variables sont `--dp-bg`, `--dp-nav`, `--dp-text`.
- ⚠️ Avatar utilise seulement l'initiale (pas l'image dicebear de la Navbar)
- ⚠️ 100% inline styles — aucun Tailwind

**Propositions d'amélioration :**
1. **Corriger les CSS variables fantômes** → Soit les définir dans globals.css, soit migrer vers `--dp-*`
2. **Avatar cohérent** — Utiliser la même image dicebear que la Navbar (ou l'inverse)
3. **Migrer vers Tailwind** — Le formulaire modal pourrait être 50% plus court avec les classes utilitaires
4. **Ajouter transition de page** — Entrée animée au lancement de l'app (fade-up des cartes avec stagger)
5. **Edit/Delete profile** — Actuellement on ne peut que créer, pas modifier ni supprimer

---

### PAGE 2 : HomePage (308 LOC)

**État actuel :**
- ✅ 25 rails de contenu avec title cycling animé
- ✅ HeroBanner 5 items avec auto-rotation
- ✅ BrandRow (Marvel, Pixar, etc.)
- ✅ Déduplication inter-rails
- ⚠️ **Pas de i18n** — Tous les titres/taglines en dur en anglais
- ⚠️ **Loading/Error states en inline styles** au lieu du Spinner partagé
- ⚠️ 100% inline styles sur le conteneur principal
- ⚠️ Background image fixe (home-background.png) — ne s'adapte pas au contenu

**Propositions d'amélioration :**
1. **i18n les 25 rail titles + taglines** — Clés `home.rail.action.title`, `home.rail.action.tagline`, etc.
2. **Utiliser `<Spinner />` partagé** au lieu du `<LoadingState>` custom
3. **Skeleton loaders** — Montrer des cartes fantômes au chargement au lieu de texte "Loading catalog…"
4. **"Continue Watching" rail** — Rail prioritaire en position 1 basé sur playback history
5. **Scroll-to-top** — Bouton flottant quand on descend dans les 25 rails
6. **Pull-to-refresh** — Recharger le catalogue sans recharger la page

---

### PAGE 3 : BrowsePage (216 LOC)

**État actuel :**
- ✅ Filtres avancés (FilterDrawer) avec CatalogFilters splitté
- ✅ Skeleton loaders (28 cards `animate-pulse`)
- ✅ Infinite scroll ("Load More" button)
- ✅ i18n complet
- ✅ Search debounce 150ms
- ✅ HoverCard au survol
- ✅ Bon usage de Tailwind (responsive grid)
- ⚠️ "Load More" button au lieu de IntersectionObserver (comme CollectionsPage)

**Propositions d'amélioration :**
1. **IntersectionObserver** pour infinite scroll (comme CollectionsPage) au lieu du bouton
2. **Chips de filtres actifs** — Montrer les filtres appliqués en haut avec un ×
3. **Compteur de résultats** — "243 films" sous le titre
4. **Animation de transition** entre les modes All/Movie/TV (AnimatePresence)
5. **Tri visible** — Dropdown sort (popularité, date, note) visible sans ouvrir le drawer

---

### PAGE 4 : DetailPage (132 LOC)

**État actuel :**
- ✅ Architecture splitée (HeroSection, InfoSection, DetailEpisodes, etc.)
- ✅ 9 sections modulaires (Cast, Gallery, Saga, Similar, etc.)
- ✅ Backdrop progressif (500px → original)
- ✅ Playback error toast
- ⚠️ **i18n partiel** — Bouton retour "Movies"/"Series" pas traduit
- ⚠️ **HeroSection 206 LOC** — Dépasse la limite de 200

**Propositions d'amélioration :**
1. **i18n complet** — Bouton retour, labels de section, textes d'erreur
2. **Trim HeroSection** — Extraire les boutons d'action dans `DetailActions.tsx`
3. **Watch providers** — Afficher où le contenu est dispo en streaming (TMDB watch/providers API)
4. **Reviews section** — Ajouter les reviews TMDB
5. **Trailer inline** — Lecture YouTube embed au lieu de l'ouvrir dans le navigateur
6. **Share button** — Copier le lien du contenu

---

### PAGE 5 : SourcesPage (183 LOC)

**État actuel :**
- ✅ Architecture splitée (SourceCard, SourceBadges, SourcesSidebar, etc.)
- ✅ Groupement par qualité (1080p, 720p, etc.)
- ✅ BestSourceCard en highlight
- ✅ ResumeModal intégré
- ⚠️ **Pas de i18n** — Tout en anglais hardcodé
- ⚠️ **Pas de skeleton loading** — Spinner simple

**Propositions d'amélioration :**
1. **i18n complet** — Titres, labels de qualité, messages d'erreur
2. **Skeleton loader** — Montrer la structure pendant le chargement (cards fantômes)
3. **Auto-play best source** — Option pour lancer automatiquement la meilleure source
4. **Source health indicator** — Dot vert/orange/rouge basé sur seeders/vitesse
5. **Favoris de sources** — Mémoriser les trackers/sources préférés de l'utilisateur
6. **Filtres persistants** — Se souvenir des préférences de qualité (1080p only, etc.)

---

### PAGE 6 : PlayerPage (172 LOC)

**État actuel :**
- ✅ Autoplay next episode avec countdown
- ✅ Prev/Next episode cards
- ✅ Progress saving vers backend
- ✅ BroadcastChannel overlay bridge
- ✅ usePlayerLifecycle hook (IPC cleanup propre)
- ⚠️ **Pas de i18n**
- ⚠️ **Pas de raccourcis clavier affichés** (F pour fullscreen, M pour mute, etc.)

**Propositions d'amélioration :**
1. **i18n** — Messages d'erreur, labels des boutons
2. **Keyboard shortcuts overlay** — Afficher `?` pour la liste des raccourcis
3. **Skip intro/outro** — Bouton "Passer l'intro" (détection basée sur chapitres MPV)
4. **Picture-in-Picture** — Mini player pour naviguer tout en regardant
5. **Qualité dynamique** — Afficher la résolution en cours + option de changement

---

### PAGE 7 : CollectionsPage (269 LOC)

**État actuel :**
- ✅ IntersectionObserver pour infinite scroll
- ✅ Search avec filtrage live
- ✅ Category pills (All, Action, Fantasy, etc.)
- ✅ i18n partiel
- ✅ Tailwind responsive grid
- ⚠️ **Catégories en dur en anglais** (pas i18n)
- ⚠️ **detectCategory() utilise regex** — fragile, pourrait utiliser les genres TMDB

**Propositions d'amélioration :**
1. **i18n les category labels** — "All", "Action", etc. via `t()`
2. **Utiliser les genres TMDB** au lieu du regex pour la catégorisation
3. **Animation de grid** — AnimatePresence + layout animation au changement de filtre
4. **Compteur par catégorie** — Badge avec le nombre de collections par catégorie
5. **Collection progress** — Barre de progression "3/8 films vus" sur chaque card

---

### PAGE 8 : CollectionDetailPage (153 LOC)

**État actuel :**
- ✅ Hero section avec backdrop
- ✅ Grid de films triés par année
- ✅ Lazy loading images
- ⚠️ **Pas de i18n**
- ⚠️ **Pas de progress tracking** — On ne voit pas quels films on a déjà vus

**Propositions d'amélioration :**
1. **i18n** — Labels, textes vides
2. **Watched indicator** — Badge ✓ sur les films déjà vus
3. **Watch order** — Option chronologique vs date de sortie
4. **Play next unwatched** — Bouton "Reprendre la saga" qui lance le prochain non-vu
5. **Total runtime** — Afficher la durée totale de la saga

---

### PAGE 9 : MyListsPage (115 LOC)

**État actuel :**
- ✅ List selector avec pills
- ✅ Framer Motion layout animation
- ✅ i18n complet
- ⚠️ **Utilise CSS variables fantômes** (`--color-text-secondary`, etc.) — mêmes que ProfileSelectPage
- ⚠️ **Pas de drag & drop** pour réorganiser

**Propositions d'amélioration :**
1. **Corriger CSS variables** → Migrer vers `--dp-*` ou les définir
2. **Drag & drop** — Réorganiser les items dans une liste
3. **Create/Delete list** — Actuellement on ne peut que voir les listes existantes
4. **List sharing** — Exporter/partager une liste
5. **Grid/List view toggle** — Basculer entre vue grille et vue liste

---

### PAGE 10 : SearchPage (93 LOC)

**État actuel :**
- ✅ Debounce 500ms
- ✅ Dual query movies + series en parallèle
- ✅ i18n complet
- ✅ Responsive grid
- ⚠️ **500ms debounce** — Trop lent, 250ms serait mieux
- ⚠️ **Pas de suggestions/autocomplete**

**Propositions d'amélioration :**
1. **Réduire debounce à 250ms** — Plus réactif
2. **Recherche par acteur** — Intégrer person search TMDB
3. **Historique de recherche** — Dernières recherches récentes
4. **Trending searches** — Suggestions de recherche populaires
5. **Filtres sur résultats** — Genre, année, note minimum

---

### PAGE 11 : ActorPage (154 LOC)

**État actuel :**
- ✅ Hero avec blur backdrop du portrait
- ✅ Ambient color extraction
- ✅ Filmography count badge
- ✅ i18n complet
- ✅ ContentRails pour movies/series
- ⚠️ **Pas de bio** — Pas d'affichage de la biographie TMDB

**Propositions d'amélioration :**
1. **Biographie** — Afficher la bio TMDB (collapsible si longue)
2. **Known For section** — Top 5 films les plus populaires mis en avant
3. **External links** — IMDb, Instagram, Twitter (TMDB external_ids API)
4. **Age/Birthday** — Afficher la date de naissance et l'âge
5. **Filmography timeline** — Vue chronologique au lieu de rails

---

### PAGE 12 : SettingsPage (12 LOC) — STUB

**État actuel :**
- ⚠️ **Placeholder vide** — Heading + texte "Coming in Phase 2"
- ✅ i18n

**Propositions d'amélioration :**
1. **Apparence** — Choix de thème (dark/darker/AMOLED), taille de police, langue
2. **Lecture** — Qualité par défaut, autoplay, sous-titres préférés, langue audio
3. **Real-Debrid** — Configuration API key, cache management
4. **Stockage** — Gestion du cache local, espace utilisé
5. **À propos** — Version app, changelog, crédits
6. **Profil** — Edit name, avatar, kids mode, delete profile

---

### PAGE 13 : ProfilePage (10 LOC) — STUB

**État actuel :**
- ⚠️ **Placeholder vide**
- ⚠️ **Pas de i18n**

**Propositions d'amélioration :**
1. Fusionner avec SettingsPage ou implémenter comme sous-section de Settings

---

### PAGE 14 : DebugPage (61 LOC)

**État actuel :**
- ✅ Color-coded log levels
- ✅ Copy to clipboard
- ✅ Clear logs
- ⚠️ **Pas de i18n** (acceptable — dev tool)
- ⚠️ **Pas de filtre** par niveau de log

**Propositions d'amélioration :**
1. **Filtre par niveau** — Toggle error/warn/info/success
2. **Recherche dans les logs** — Input pour filtrer par texte
3. **Export logs** — Bouton pour sauvegarder en fichier
4. **Auto-scroll** — Suivre les nouveaux logs en temps réel

---

## 3. INCOHÉRENCES DESIGN CRITIQUES

### 3.1 — CSS Variables fantômes (BUG)
**Gravité : CRITIQUE**

`ProfileSelectPage.tsx` et `MyListsPage.tsx` utilisent 13 CSS variables **jamais définies** :
```
--color-bg-primary, --color-accent, --color-text-primary, --color-text-secondary,
--color-text-muted, --color-bg-glass, --color-bg-overlay, --color-bg-card,
--radius-card, --radius-pill, --radius-modal, --radius-button, --font-main
```
Les vraies variables sont `--dp-bg`, `--dp-nav`, `--dp-text`, `--dp-card-border`, etc.

**Impact** : Ces 2 pages utilisent les valeurs par défaut du navigateur (transparent, initial, serif) → rendu potentiellement cassé.

### 3.2 — Mélange de 3 approches CSS
| Approche | Pages |
|----------|-------|
| 100% inline styles | HomePage, ContentRail, ProfileSelectPage |
| 100% Tailwind | CollectionsPage, DebugPage |
| Mix inline + Tailwind | BrowsePage, DetailPage, ActorPage, SearchPage, Navbar |

**Impact** : Code inconsistant, difficulté de maintenance, styles non réutilisables.

### 3.3 — i18n incomplet
| Page | i18n Status |
|------|-------------|
| ProfileSelectPage | ✅ Complet |
| BrowsePage | ✅ Complet |
| CollectionsPage | ⚠️ Partiel (categories en dur) |
| MyListsPage | ✅ Complet |
| SearchPage | ✅ Complet |
| ActorPage | ✅ Complet |
| SettingsPage | ✅ (stub) |
| TitleBar | ✅ Complet |
| **HomePage** | ❌ Aucun (25 rails hardcodés) |
| **DetailPage** | ⚠️ Partiel |
| **SourcesPage** | ❌ Aucun |
| **PlayerPage** | ❌ Aucun |
| **CollectionDetailPage** | ❌ Aucun |
| **DebugPage** | ❌ (acceptable) |
| **Navbar** | ❌ Labels en dur |

### 3.4 — Loading states incohérents
| Pattern | Pages utilisant |
|---------|----------------|
| `<Spinner />` partagé | SearchPage, SourcesPage, ActorPage |
| `<p>Loading…</p>` custom | HomePage |
| `animate-pulse` skeleton | BrowsePage (28 cards) |
| `<LoadingScreen>` custom | PlayerPage |
| `<DetailSkeleton>` | DetailPage |
| `<p>{t('...')}</p>` texte | ProfileSelectPage, MyListsPage |

**Impact** : 6 patterns différents pour le même besoin.

### 3.5 — Error states incohérents
- HomePage : `<div>` centré avec texte gris
- SourcesPage : Bannière rouge fixe en bas
- DetailPage : Toast rouge
- ErrorBoundary : Bordure + bouton retry
- Pas de toast system centralisé

### 3.6 — Couleurs hardcodées vs tokens
Des valeurs comme `#f9f9f9`, `rgba(249,249,249,0.45)`, `rgba(255,255,255,0.08)` sont répétées dans des dizaines de fichiers au lieu d'utiliser les tokens Tailwind `text-dp-text`, `border-dp-card-border`.

### 3.7 — Navbar labels pas traduits
Les labels "HOME", "SEARCH", "WATCHLIST", "MOVIES", "SERIES", "COLLECTIONS" sont en dur — pas de `t()`.

---

## 4. PROPOSITIONS D'AMÉLIORATION TRANSVERSALES

### 4.1 — Unifier le design system
1. **Définir les CSS variables manquantes** dans `globals.css` OU migrer vers `--dp-*`
2. **Créer un fichier `design-tokens.ts`** centralisant toutes les couleurs/spacing/radius
3. **Standardiser sur Tailwind** — Éliminer les inline styles sauf pour les valeurs dynamiques

### 4.2 — Créer les composants UI manquants
| Composant | Besoin |
|-----------|--------|
| `Toast` / `Notification` | Système centralisé de notifications (sonner ou react-hot-toast) |
| `Skeleton` | Composant réutilisable pour tous les loading states |
| `EmptyState` | Message vide générique avec icône + action |
| `Badge` | Badges réutilisables (Kids, HD, 4K, etc.) |
| `Input` | Input partagé avec label + error state |
| `Toggle` | Switch toggle partagé (actuellement custom dans ProfileSelectPage) |
| `Dropdown` | Select/dropdown partagé |
| `Tabs` | Tab navigation partagée (actuellement custom dans MyListsPage) |
| `ConfirmDialog` | Dialogue de confirmation générique |

### 4.3 — Standardiser les états
```
Loading → <Skeleton variant="card|rail|hero|page" />
Error   → <Toast type="error" /> (notification system)
Empty   → <EmptyState icon={...} title={...} action={...} />
```

### 4.4 — i18n complet
Ajouter les clés manquantes pour : HomePage (25 rails), Navbar (6 labels), SourcesPage, PlayerPage, CollectionDetailPage, DetailPage (boutons).

### 4.5 — Animations cohérentes
- **Page transitions** — AnimatePresence sur le router (fade entre pages)
- **Card hover** — Standardiser le scale (actuellement 1.04, 1.05, 1.06 selon les pages)
- **Loading transitions** — Fade-in quand les données arrivent (au lieu de pop-in)

### 4.6 — Accessibilité
- **Focus visible** sur tous les éléments interactifs
- **aria-label** sur les boutons icon-only
- **Keyboard navigation** complète (Tab, Enter, Escape)
- **Contrast ratio** — Vérifier les textes gris sur fond sombre

---

## 5. PRIORITÉS DE CORRECTION

| # | Tâche | Impact | Effort |
|---|-------|--------|--------|
| 1 | Corriger CSS variables fantômes (2 pages cassées) | CRITIQUE | XS |
| 2 | i18n Navbar + HomePage (strings les plus visibles) | HIGH | S |
| 3 | Unifier loading states → Skeleton partagé | HIGH | M |
| 4 | Standardiser inline → Tailwind (ProfileSelectPage, HomePage, ContentRail) | MEDIUM | M |
| 5 | Toast system centralisé | MEDIUM | S |
| 6 | i18n SourcesPage + PlayerPage + CollectionDetailPage | MEDIUM | S |
| 7 | Composants UI manquants (Input, Toggle, Badge, Tabs) | MEDIUM | L |
| 8 | Page transitions (AnimatePresence router) | LOW | S |
| 9 | Implémenter SettingsPage | LOW | L |
| 10 | Continue Watching rail | LOW | M |
