import { create } from 'zustand';
import type { Source, EpisodeVideo } from '@/shared/types/index';

interface PlaybackNavigation {
  sources: Source[];
  current: Source | null;
  episodes: EpisodeVideo[];
  mediaId: string;
  mediaType: string;
  season: number | null;
  episode: number | null;
  resumeAt: number;
  episodeTitle: string;
  selectedSeason: number | null;
  selectedEpisode: number | null;
  fromDetail: boolean;
  returnTo: string;
}

interface PlaybackStore extends PlaybackNavigation {
  setNavigation: (data: Partial<PlaybackNavigation>) => void;
  clear: () => void;
}

const INITIAL: PlaybackNavigation = {
  sources: [],
  current: null,
  episodes: [],
  mediaId: '',
  mediaType: '',
  season: null,
  episode: null,
  resumeAt: 0,
  episodeTitle: '',
  selectedSeason: null,
  selectedEpisode: null,
  fromDetail: false,
  returnTo: '',
};

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  ...INITIAL,
  setNavigation: (data) => set((s) => ({ ...s, ...data })),
  clear: () => set(INITIAL),
}));
