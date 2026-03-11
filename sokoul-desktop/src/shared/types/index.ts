/** Domain types for the Sokoul application */

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

/** Media type discriminator used throughout the app to branch API calls, routing, and UI rendering between movies and series. */
export type ContentType = 'movie' | 'series' | 'tv';

/** Actor/crew entry from TMDB credits; dual path fields (profile_path, profilePath) accommodate inconsistent backend normalization. */
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
  profilePath?: string; // Fallback
}

/** Wrapper for cast data returned by the TMDB credits endpoint, consumed by the detail page's cast carousel. */
export interface Credits {
  cast: CastMember[];
}

/** Tracks where a user is in their viewing journey; 'to_resume' and 'unwatched' are computed client-side, never persisted. */
export type UserWatchStatus =
  | 'plan_to_watch'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'to_resume'
  | 'unwatched';

/** Persisted watch progress record scoped to a profile, used to restore status badges and "Continue Watching" rows. */
export interface UserProgressEntry {
  id:        number;
  profileId: number;
  contentId: string;
  status:    Exclude<UserWatchStatus, 'to_resume' | 'unwatched'>;
  progress:  number;
  rating:    number | null;
  updatedAt: number;
}

/** Describes a legal streaming option (Netflix, Canal+, etc.) for availability badges on content cards. */
export interface StreamingProvider {
  id: string;
  name: string;
  logo: string;
  type: 'sub' | 'rent' | 'buy' | 'free';
  region: string[];
  url?: string;
}

/** Aggregated availability state combining local files, debrid cache, and streaming providers into a single UI-ready shape. */
export interface ItemAvailability {
  isLocal:            boolean;
  isDebridCached:     boolean;
  streamingProviders: StreamingProvider[];
  isWatchableNow:     boolean;
}

/** Episode-level metadata for series, used to render the episode picker and track per-episode playback progress. */
export interface EpisodeVideo {
  id: string;
  title?: string;
  season?: number;
  episode?: number;
  released?: string;
  overview?: string;
  still_path?: string;
  runtime?: number;
}

/** YouTube/Vimeo video metadata returned by the TMDB /videos endpoint */
export interface VideoItem {
  id:        string;
  key:       string;
  name:      string;
  site:      string;
  type:      string;
  official?: boolean;
}

/** Core content metadata shared across cards, detail pages, and search results; optional fields accommodate partial data from different API endpoints. */
export interface CatalogMeta {
  id: string;
  type: ContentType;
  media_type?: ContentType;
  name: string;
  title?: string;
  poster?: string;
  poster_path?: string;
  background?: string;
  backdrop_path?: string;
  description?: string;
  overview?: string;
  year?: number;
  release_date?: string;
  releaseInfo?: string;
  genres?: { id: number; name: string }[] | string[];
  imdbRating?: number;
  vote_average?: number;
  runtime?: number;
  credits?: Credits;
  similar?: CatalogMeta[];
  tagline?: string;
  videos?: VideoItem[];
  /** Episode list for series, populated by the detail endpoint */
  episodes?: EpisodeVideo[];
  genre_ids?:        number[];
  genre_names?:      string[];
  first_air_date?:   string;
  original_language?: string;
  origin_country?: string[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  vote_count?: number;
  popularity?: number;
  episode_run_time?: number[];
  availability?: ItemAvailability;
  /** Director name, populated by detail endpoint */
  director?: string;
  /** Production studio name */
  studio?: string;
  /** Financial data from TMDB detail */
  budget?: number;
  revenue?: number;
  /** TMDB collection reference */
  belongs_to_collection?: { id: number; name: string; poster_path?: string; backdrop_path?: string };
}

/** Summary of a TMDB collection (e.g. "Harry Potter") for the collections grid; parts_count enables "X films" badges without loading full details. */
export interface CollectionItem {
  id:            number;
  name:          string;
  overview?:     string;
  backdrop_path: string | null;
  poster_path:   string | null;
  parts_count:   number;
}

/** Full collection with all parts loaded, used on the collection detail page to render every film in order. */
export interface CollectionDetail {
  id:            number;
  name:          string;
  overview:      string;
  backdrop_path: string | null;
  poster_path:   string | null;
  parts:         CatalogMeta[];
}

/** A single streaming source candidate with quality, language, and Real-Debrid cache status for the source picker. */
export interface Source {
  title: string;
  quality: string;
  size_gb: number;
  seeders: number;
  language: string;
  /** Raw French variant tag from backend: TRUEFRENCH | VFF | VF | VOSTFR | MULTi | FRENCH */
  language_variant?: string;
  info_hash: string;
  magnet?: string;
  source: string;
  cached_rd: boolean;
  playable: boolean;
  rd_link?: string;
  score: number;
}

/** Sources endpoint response with cache metadata; is_stale triggers a background refresh while showing cached results immediately. */
export interface SourcesResponse {
  results:   Source[];
  /** UNIX timestamp (seconds) of when results were cached */
  cached_at?: number;
  /** true when results are stale and a refresh is in progress */
  is_stale?:  boolean;
}

/** User profile identity; each profile isolates watchlists, playback history, and preferences (including kids mode content filtering). */
export interface Profile {
  id: number;
  name: string;
  avatarUrl?: string;
  isKids: boolean;
  traktExpiresAt?: number;
  createdAt: number;
}

/** A named content list (favorites, watchlist, or custom) owned by a profile, supporting the list management UI. */
export interface UserList {
  id: number;
  profileId: number;
  name: string;
  listType: 'favorites' | 'watchlist' | 'custom';
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

/** An entry in a user list, storing enough metadata (poster, year, rating) to render cards without refetching from TMDB. */
export interface ListItem {
  id: number;
  listId: number;
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
  rating?: number;
  addedAt: number;
}

/** Finite state machine for the player lifecycle; each status maps to a distinct UI state (spinner, error banner, video surface). */
export type PlaybackStatus =
  | 'idle'
  | 'debriding'
  | 'waiting_cache'
  | 'playing'
  | 'error';

/** Current player state with a user-facing message and optional error, consumed by the player overlay for status display. */
export interface PlaybackState {
  status:  PlaybackStatus;
  message: string;
  error:   string | null;
}

/** Playback position record enabling "Continue Watching" and episode-level progress bars across the app. */
export interface PlaybackEntry {
  id: number;
  profileId: number;
  contentId: string;
  contentType: ContentType;
  season?: number;
  episode?: number;
  positionMs: number;
  durationMs: number;
  progressPct: number;
  watched: boolean;
  updatedAt: number;
  episodeTitle?: string;
  stillPath?: string;
}

/* IPC types (ElectronAPI, MpvAPI, OverlayAPI, MpvTrack) are declared in src/ipc.d.ts */
