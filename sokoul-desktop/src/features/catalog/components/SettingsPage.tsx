// SettingsPage.tsx — Application settings

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useProfileStore } from '@/stores/profileStore';
import type { StreamPreferences } from '@/stores/preferencesStore';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string;
}

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 text-white/30">
      {label}
    </h2>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
      <div className="flex flex-col gap-0.5 pr-4">
        <span className="text-sm font-medium text-white/90">{label}</span>
        {description && (
          <span className="text-xs text-white/40">{description}</span>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full',
        'transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-white-15)]',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
          'transition duration-200 ease-in-out m-0.5',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

interface SelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function Select<T extends string>({ value, options, onChange }: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-lg px-3 py-1.5 text-sm focus:outline-none cursor-pointer
                 bg-white/[0.07] border border-[var(--color-white-12)] text-white/[0.85]
                 min-w-[120px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-overlay)]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Preferences store
  const {
    preferredLanguage,
    minQuality,
    preferCachedRD,
    autoPlay,
    setPreferences,
  } = usePreferencesStore();

  // Profile store
  const activeProfile = useProfileStore((s) => s.activeProfile);

  // Helper: partial update
  function update(partial: Partial<StreamPreferences>) {
    setPreferences(partial);
  }

  // Options
  const languageOptions: { value: StreamPreferences['preferredLanguage']; label: string }[] = [
    { value: 'fr', label: t('settings.langFrench') },
    { value: 'en', label: t('settings.langEnglish') },
    { value: 'any', label: t('settings.langAny') },
  ];

  const qualityOptions: { value: StreamPreferences['minQuality']; label: string }[] = [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '2160p', label: '2160p (4K)' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-8 text-[var(--color-text-primary)] bg-[var(--color-bg-base)]">
      <div className="max-w-[672px] mx-auto">

        {/* Page heading */}
        <h1 className="text-3xl font-bold mb-10 text-white/[0.95]">
          {t('settings.heading')}
        </h1>

        {/* ------------------------------------------------------------------ */}
        {/* Section 1: Playback preferences                                     */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionPlayback')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            <SettingsRow
              label={t('settings.audioLanguage')}
              description={t('settings.audioLanguageDesc')}
            >
              <Select
                value={preferredLanguage}
                options={languageOptions}
                onChange={(v) => update({ preferredLanguage: v })}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.minQuality')}
              description={t('settings.minQualityDesc')}
            >
              <Select
                value={minQuality}
                options={qualityOptions}
                onChange={(v) => update({ minQuality: v })}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.preferCachedRD')}
              description={t('settings.preferCachedRDDesc')}
            >
              <Toggle
                checked={preferCachedRD}
                onChange={(v) => update({ preferCachedRD: v })}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.autoPlay')}
              description={t('settings.autoPlayDesc')}
            >
              <Toggle
                checked={autoPlay}
                onChange={(v) => update({ autoPlay: v })}
              />
            </SettingsRow>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2: Account                                                  */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionAccount')} />
          <div className="rounded-xl p-4 bg-white/5 border border-[var(--color-border-medium)]">
            {/* Active profile */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-white/[0.35]">
                  {t('settings.activeProfile')}
                </span>
                {activeProfile ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-semibold text-white/90">
                      {activeProfile.name}
                    </span>
                    {activeProfile.isKids && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/[0.35]">
                        {t('profile.kids')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm italic text-white/40">
                    {t('settings.noProfile')}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate('/profile-select')}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150
                           hover:opacity-80 active:scale-95
                           bg-[var(--color-white-8)] border border-[var(--color-white-12)] text-white/[0.85]"
              >
                {t('settings.switchProfile')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile-select')}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150
                           hover:opacity-80 active:scale-95
                           bg-[var(--color-accent)] text-white"
              >
                {t('profile.manageProfiles')}
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 3: About                                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-10">
          <SectionHeader label={t('settings.sectionAbout')} />
          <div className="rounded-xl p-4 flex flex-col gap-3 bg-white/5 border border-[var(--color-border-medium)]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">
                {t('settings.appName')}
              </span>
              <span className="text-sm font-semibold text-white/90">
                Sokoul
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-y border-[var(--color-border)]">
              <span className="text-sm text-white/60">
                {t('settings.dataSource')}
              </span>
              <span className="text-xs font-medium text-white/40">
                {t('settings.dataSourceValue')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">
                {t('settings.backend')}
              </span>
              <span className="text-xs font-medium text-white/40">
                {t('settings.backendValue')}
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
