// settingsWidgets.tsx — Reusable sub-components for the Settings page.
// Extracted to keep SettingsPage.tsx under 300 lines (AGENTS.md Rule 4).

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string;
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest mb-4 text-white/30">
      {label}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Row with label + control
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsRow({ label, description, children }: SettingsRowProps) {
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

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
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

// ---------------------------------------------------------------------------
// Select dropdown
// ---------------------------------------------------------------------------

interface SelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({ value, options, onChange }: SelectProps<T>) {
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
// Service connection tester
// ---------------------------------------------------------------------------

type ServiceStatus = 'idle' | 'testing' | 'ok' | 'error';

export function ServiceTestButton({ url, label }: { url: string; label: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ServiceStatus>('idle');

  const test = useCallback(async () => {
    if (!url) { setStatus('error'); return; }
    setStatus('testing');
    try {
      const target = url.replace(/\/$/, '') + '/health';
      await fetch(target, { signal: AbortSignal.timeout(5000) });
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, [url]);

  const icon = status === 'ok' ? '✅' : status === 'error' ? '❌' : status === 'testing' ? '⏳' : '🔍';

  return (
    <button
      onClick={test}
      disabled={status === 'testing'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                 bg-white/[0.07] border border-[var(--color-white-12)] text-white/60
                 hover:bg-white/10 transition-colors disabled:opacity-50"
    >
      {icon} {status === 'idle' ? t('settings.testConnection') : t(`settings.serviceStatus_${status}`)}
    </button>
  );
}
