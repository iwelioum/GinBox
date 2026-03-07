// SettingsPage.tsx — Application settings
// Skeleton Phase 1 — implementation in next phase

import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '4rem 2rem', color: 'var(--color-text-primary)' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>{t('settings.heading')}</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>{t('settings.placeholder')}</p>
    </div>
  );
}
