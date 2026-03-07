import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/shared/i18n';

/** Captures user streaming preferences (language, quality floor) that drive automatic source selection in the player. */
export interface StreamPreferences {
  preferredLanguage: 'fr' | 'en' | 'any';
  minQuality: '480p' | '720p' | '1080p' | '2160p';
  preferCachedRD: boolean;
  autoPlay: boolean;
  uiLanguage: 'fr' | 'en';
}

interface StreamPreferencesStore extends StreamPreferences {
  setPreferences: (prefs: Partial<StreamPreferences>) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: StreamPreferences = {
  preferredLanguage: 'fr',
  minQuality: '1080p',
  preferCachedRD: true,
  autoPlay: false,
  uiLanguage: 'fr',
};

/** Persists streaming preferences to localStorage so users don't reconfigure quality and language settings on every launch. */
export const usePreferencesStore = create<StreamPreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setPreferences: (prefs) => {
        if (prefs.uiLanguage) i18n.changeLanguage(prefs.uiLanguage);
        set(prefs);
      },
      resetPreferences: () => {
        i18n.changeLanguage(DEFAULT_PREFERENCES.uiLanguage);
        set(DEFAULT_PREFERENCES);
      },
    }),
    {
      name: 'sokoul_stream_preferences',
      onRehydrateStorage: () => (state) => {
        if (state?.uiLanguage) i18n.changeLanguage(state.uiLanguage);
      },
    }
  )
);
