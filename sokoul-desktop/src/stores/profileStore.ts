// store/profileStore.ts — Role: Active profile
// RULES: None

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '@/shared/types/index';

interface ProfileStore {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
}

/** Persists the active user profile across sessions so watchlists, playback history, and preferences load for the correct user on restart. */
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (activeProfile) => set({ activeProfile }),
    }),
    {
      name: 'sokoul-profile-storage',
    }
  )
);
