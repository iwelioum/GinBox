import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ui/ErrorBoundary';
import { Layout }        from '../shared/components/layout/Layout';
import LoadingFallback   from '../shared/components/ui/LoadingFallback';

const ProfileSelectPage    = lazy(() => import('../features/catalog/components/ProfileSelectPage'));
const HomePage             = lazy(() => import('../features/catalog/components/HomePage'));
const SearchPage           = lazy(() => import('../features/search/components/SearchPage'));
const DetailPage           = lazy(() => import('../features/detail/components/DetailPage'));
const SourcesPage          = lazy(() => import('../features/detail/components/SourcesPage'));
const PlayerPage           = lazy(() => import('../features/player/components/PlayerPage'));
const OverlayPage          = lazy(() => import('../features/player/components/OverlayPage'));
const MyListsPage          = lazy(() => import('../features/catalog/components/MyListsPage'));
const ActorPage            = lazy(() => import('../features/catalog/components/ActorPage'));
const CollectionsPage      = lazy(() => import('../features/catalog/components/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('../features/catalog/components/CollectionDetailPage'));
const BrowsePage           = lazy(() => import('../features/catalog/components/BrowsePage'));
const ProfilePage          = lazy(() => import('../features/catalog/components/ProfilePage'));
const SettingsPage         = lazy(() => import('../features/catalog/components/SettingsPage'));
const DebugPage            = lazy(() => import('../features/catalog/components/DebugPage'));

/** Forces full remount of PlayerPage when content changes */
function PlayerWrapper() {
  const [searchParams] = useSearchParams();
  const contentId = searchParams.get('contentId') ?? '';
  const contentType = searchParams.get('contentType') ?? '';
  const streamUrl = searchParams.get('url') ?? '';
  return <PlayerPage key={`${contentType}:${contentId}:${streamUrl}`} />;
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Player & overlay have their own error boundaries to avoid cross-feature crashes */}
      <Route path="/profile-select" element={<ErrorBoundary area="profiles"><ProfileSelectPage /></ErrorBoundary>} />
      <Route path="/player"  element={<ErrorBoundary area="player"><PlayerWrapper /></ErrorBoundary>} />
      <Route path="/overlay" element={<ErrorBoundary area="overlay"><OverlayPage /></ErrorBoundary>} />
      <Route path="/debug"   element={<DebugPage />} />

      <Route element={<Layout />}>
        <Route path="/"                    element={<ErrorBoundary area="home"><HomePage /></ErrorBoundary>} />
        <Route path="/search"              element={<ErrorBoundary area="search"><SearchPage /></ErrorBoundary>} />
        <Route path="/detail/:type/:id"    element={<ErrorBoundary area="detail"><DetailPage /></ErrorBoundary>} />
        <Route path="/sources/:type/:id"   element={<ErrorBoundary area="sources"><SourcesPage /></ErrorBoundary>} />
        <Route path="/lists"               element={<ErrorBoundary area="lists"><MyListsPage /></ErrorBoundary>} />
        <Route path="/films"               element={<ErrorBoundary area="catalog"><BrowsePage mode="movie" /></ErrorBoundary>} />
        <Route path="/series"              element={<ErrorBoundary area="catalog"><BrowsePage mode="series" /></ErrorBoundary>} />
        <Route path="/collections"          element={<ErrorBoundary area="collections"><CollectionsPage /></ErrorBoundary>} />
        <Route path="/collection/:id"      element={<ErrorBoundary area="collection"><CollectionDetailPage /></ErrorBoundary>} />
        <Route path="/actor/:id"           element={<ErrorBoundary area="actor"><ActorPage /></ErrorBoundary>} />
        <Route path="/profile"             element={<ErrorBoundary area="profile"><ProfilePage /></ErrorBoundary>} />
        <Route path="/settings"            element={<ErrorBoundary area="settings"><SettingsPage /></ErrorBoundary>} />
        <Route path="/favorites"           element={<Navigate to="/lists" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App;
