// SettingsPage.tsx — Application settings

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useProfileStore } from '@/stores/profileStore';
import { useQueryClient } from '@tanstack/react-query';
import { client as apiClient } from '@/shared/api/client';
import type { StreamPreferences } from '@/stores/preferencesStore';
import { SectionHeader, SettingsRow, Toggle, Select, ServiceTestButton } from './settingsWidgets';
import { useToast } from '@/shared/hooks/useToast';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    preferredLanguage,
    minQuality,
    preferCachedRD,
    autoPlay,
    uiLanguage,
    setPreferences,
    resetPreferences,
  } = usePreferencesStore();

  const activeProfile = useProfileStore((s) => s.activeProfile);

  function update(partial: Partial<StreamPreferences>) {
    setPreferences(partial);
    toast(t('settings.saved'), 'success', 2000);
  }

  // RD status
  const [rdStatus, setRdStatus] = useState<{ username?: string; expiration?: string; error?: string } | null>(null);
  const [rdLoading, setRdLoading] = useState(false);

  const checkRdStatus = useCallback(async () => {
    setRdLoading(true);
    try {
      const resp = await apiClient.get('/debrid/status');
      setRdStatus(resp.data);
    } catch {
      setRdStatus({ error: 'Connection failed' });
    } finally {
      setRdLoading(false);
    }
  }, []);

  // Cache operations
  const [clearingCache, setClearingCache] = useState<string | null>(null);

  const clearCache = useCallback(async (type: 'streams' | 'metadata') => {
    setClearingCache(type);
    try {
      if (type === 'streams') {
        queryClient.removeQueries({ queryKey: ['sources'] });
      } else {
        queryClient.removeQueries({ queryKey: ['catalog'] });
        queryClient.removeQueries({ queryKey: ['detail'] });
      }
      toast(t('settings.cacheCleared'), 'success', 2500);
    } finally {
      setClearingCache(null);
    }
  }, [queryClient, toast, t]);

  // Options
  const languageOptions: { value: StreamPreferences['preferredLanguage']; label: string }[] = [
    { value: 'fr', label: t('settings.langFrench') },
    { value: 'en', label: t('settings.langEnglish') },
    { value: 'any', label: t('settings.langAny') },
  ];

  const qualityOptions: { value: StreamPreferences['minQuality']; label: string }[] = [
    { value: '2160p', label: '2160p (4K)' },
    { value: '1080p', label: '1080p' },
    { value: '720p', label: '720p' },
    { value: '480p', label: '480p' },
  ];

  const uiLangOptions: { value: 'fr' | 'en'; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-8 text-[var(--color-text-primary)] bg-[var(--color-bg-base)]">
      <div className="max-w-[672px] mx-auto">

        <h1 className="text-3xl font-bold mb-10 text-white/[0.95]">
          {t('settings.heading')}
        </h1>

        {/* ── Section: Playback ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionPlayback')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <SettingsRow label={t('settings.audioLanguage')} description={t('settings.audioLanguageDesc')}>
              <Select value={preferredLanguage} options={languageOptions} onChange={(v) => update({ preferredLanguage: v })} />
            </SettingsRow>
            <SettingsRow label={t('settings.minQuality')} description={t('settings.minQualityDesc')}>
              <Select value={minQuality} options={qualityOptions} onChange={(v) => update({ minQuality: v })} />
            </SettingsRow>
            <SettingsRow label={t('settings.preferCachedRD')} description={t('settings.preferCachedRDDesc')}>
              <Toggle checked={preferCachedRD} onChange={(v) => update({ preferCachedRD: v })} />
            </SettingsRow>
            <SettingsRow label={t('settings.autoPlay')} description={t('settings.autoPlayDesc')}>
              <Toggle checked={autoPlay} onChange={(v) => update({ autoPlay: v })} />
            </SettingsRow>
          </div>
        </section>

        {/* ── Section: Sources ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionSources')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <SettingsRow label="Torrentio" description={t('settings.torrentioDesc')}>
              <ServiceTestButton url="http://torrentio.strem.fun" label="Torrentio" />
            </SettingsRow>
            <SettingsRow label="Prowlarr" description={t('settings.prowlarrDesc')}>
              <ServiceTestButton url="http://localhost:9696" label="Prowlarr" />
            </SettingsRow>
            <SettingsRow label="Wastream" description={t('settings.wastreamDesc')}>
              <ServiceTestButton url="http://localhost:7000" label="Wastream" />
            </SettingsRow>
            <SettingsRow label="FlareSolverr" description={t('settings.flaresolverrDesc')}>
              <ServiceTestButton url="http://localhost:8191" label="FlareSolverr" />
            </SettingsRow>
          </div>
        </section>

        {/* ── Section: Real-Debrid ── */}
        <section className="mb-10">
          <SectionHeader label="Real-Debrid" />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white/90">{t('settings.rdStatus')}</span>
                {rdStatus && !rdStatus.error && (
                  <span className="text-xs text-green-400">
                    {rdStatus.username} — {t('settings.rdExpires')}: {rdStatus.expiration ?? '—'}
                  </span>
                )}
                {rdStatus?.error && (
                  <span className="text-xs text-red-400">{rdStatus.error}</span>
                )}
                {!rdStatus && (
                  <span className="text-xs text-white/40">{t('settings.rdNotChecked')}</span>
                )}
              </div>
              <button
                onClick={checkRdStatus}
                disabled={rdLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.07] border border-[var(--color-white-12)]
                           text-white/60 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {rdLoading ? '⏳' : '🔄'} {t('settings.rdCheck')}
              </button>
            </div>
            <SettingsRow label={t('settings.preferCachedRD')} description={t('settings.rdCachePriorityDesc')}>
              <Toggle checked={preferCachedRD} onChange={(v) => update({ preferCachedRD: v })} />
            </SettingsRow>
          </div>
        </section>

        {/* ── Section: Appearance ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionAppearance')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <SettingsRow label={t('settings.theme')} description={t('settings.themeDesc')}>
              <span className="text-sm text-white/50">{t('settings.themeDark')}</span>
            </SettingsRow>
            <SettingsRow label={t('settings.uiLanguage')} description={t('settings.uiLanguageDesc')}>
              <Select value={uiLanguage} options={uiLangOptions} onChange={(v) => update({ uiLanguage: v })} />
            </SettingsRow>
          </div>
        </section>

        {/* ── Section: Account ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionAccount')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-white/[0.35]">{t('settings.activeProfile')}</span>
                {activeProfile ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-semibold text-white/90">{activeProfile.name}</span>
                    {activeProfile.isKids && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/[0.35]">
                        {t('profile.kids')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm italic text-white/40">{t('settings.noProfile')}</span>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate('/profile-select')}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-150
                           hover:opacity-80 active:scale-95
                           bg-[var(--color-white-8)] border border-[var(--color-white-12)] text-white/[0.85]"
              >
                {t('settings.switchProfile')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile-select')}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-150
                           hover:opacity-80 active:scale-95
                           bg-[var(--color-accent)] text-white"
              >
                {t('profile.manageProfiles')}
              </button>
            </div>
          </div>
        </section>

        {/* ── Section: Data ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionData')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <SettingsRow label={t('settings.clearStreamCache')} description={t('settings.clearStreamCacheDesc')}>
              <button
                onClick={() => clearCache('streams')}
                disabled={clearingCache === 'streams'}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.07] border border-[var(--color-white-12)]
                           text-white/60 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors disabled:opacity-50"
              >
                {clearingCache === 'streams' ? '⏳' : '🗑️'} {t('settings.clear')}
              </button>
            </SettingsRow>
            <SettingsRow label={t('settings.clearMetadataCache')} description={t('settings.clearMetadataCacheDesc')}>
              <button
                onClick={() => clearCache('metadata')}
                disabled={clearingCache === 'metadata'}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.07] border border-[var(--color-white-12)]
                           text-white/60 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors disabled:opacity-50"
              >
                {clearingCache === 'metadata' ? '⏳' : '🗑️'} {t('settings.clear')}
              </button>
            </SettingsRow>
            <SettingsRow label={t('settings.resetPreferences')} description={t('settings.resetPreferencesDesc')}>
              <button
                onClick={() => { resetPreferences(); toast(t('settings.preferencesReset'), 'info', 2500); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.07] border border-[var(--color-white-12)]
                           text-white/60 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
              >
                🔄 {t('settings.reset')}
              </button>
            </SettingsRow>
          </div>
        </section>

        {/* ── Section: About ── */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionAbout')} />
          <div className="rounded-xl p-4 flex flex-col gap-3 bg-white/5 border border-[var(--color-border-medium)]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">{t('settings.appName')}</span>
              <span className="text-sm font-semibold text-white/90">Sokoul</span>
            </div>
            <div className="flex justify-between items-center py-3 border-y border-[var(--color-border)]">
              <span className="text-sm text-white/60">{t('settings.dataSource')}</span>
              <span className="text-xs font-medium text-white/40">{t('settings.dataSourceValue')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">{t('settings.backend')}</span>
              <span className="text-xs font-medium text-white/40">{t('settings.backendValue')}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
