import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ui/ErrorBoundary';
import ProfileSelectPage from '../features/catalog/components/ProfileSelectPage';
import HomePage          from '../features/catalog/components/HomePage';
import SearchPage        from '../features/search/components/SearchPage';
import DetailPage        from '../features/detail/components/DetailPage';
import SourcesPage       from '../features/detail/components/SourcesPage';
import PlayerPage        from '../features/player/components/PlayerPage';
import OverlayPage       from '../features/player/components/OverlayPage';
import MyListsPage       from '../features/catalog/components/MyListsPage';
import ActorPage         from '../features/catalog/components/ActorPage';
import CollectionsPage      from '../features/catalog/components/CollectionsPage';
import CollectionDetailPage from '../features/catalog/components/CollectionDetailPage';
import BrowsePage        from '../features/catalog/components/BrowsePage';
import ProfilePage       from '../features/catalog/components/ProfilePage';
import SettingsPage      from '../features/catalog/components/SettingsPage';

import DebugPage         from '../features/catalog/components/DebugPage';
import { Layout }        from '../shared/components/layout/Layout';

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
  );
}

export default App;
