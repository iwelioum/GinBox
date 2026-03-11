// SubtitlesPanel.tsx — Subtitle track selector
// Includes "Disabled" at the top of the list

import { useTranslation } from 'react-i18next';
import type { MpvTrack } from '@/shared/types/ipc';
import i18n from '@/shared/i18n';

interface SubtitlesPanelProps {
  tracks:    MpvTrack[];
  onSelect:  (id: number) => void;
  onDisable: () => void;
  onClose:   () => void;
}

function trackLabel(track: MpvTrack): string {
  if (track.lang && track.codec) return `${track.lang.toUpperCase()} — ${track.codec.toUpperCase()}`;
  if (track.lang)                return track.lang.toUpperCase();
  if (track.title)               return track.title;
  return i18n.t('player.trackLabel', { id: track.id });
}

function TrackRow({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm',
        'transition-colors duration-[var(--transition-fast)]',
        active ? 'text-[var(--color-text-primary)] font-semibold bg-white/[0.07]' : 'text-[var(--color-text-primary)]/60 font-normal bg-transparent',
        active ? 'hover:bg-white/10' : 'hover:bg-[var(--color-white-4)]',
      ].join(' ')}
    >
      <span className={[
        'w-1.5 h-1.5 rounded-full shrink-0 border border-[var(--color-text-primary)]/40',
        active ? 'bg-[var(--color-text-primary)]' : 'bg-transparent',
      ].join(' ')} />
      {label}
    </div>
  );
}

export function SubtitlesPanel({ tracks, onSelect, onDisable, onClose }: SubtitlesPanelProps) {
  const { t } = useTranslation();
  const noneActive = tracks.length === 0 || tracks.every(t => !t.selected);

  return (
    <div className="absolute right-4 bottom-full mb-2 w-[260px] bg-[var(--color-bg-elevated)]
                    border border-[rgba(202,202,202,0.2)] rounded-[var(--radius-sm)]
                    py-3 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      {/* Title */}
      <p className="text-[var(--color-text-primary)]/50 text-[13px] tracking-[1.42px] px-4 pb-2 uppercase m-0">
        {t('player.subtitlesTitle')}
      </p>

      {/* Disabled option */}
      <TrackRow
        active={noneActive}
        label={t('player.disabled')}
        onClick={() => { onDisable(); onClose(); }}
      />

      {/* Separator */}
      {tracks.length > 0 && (
        <div className="h-px mx-4 my-1 bg-[var(--color-white-8)]" />
      )}

      {/* Track list */}
      {tracks.map(track => (
        <TrackRow
          key={track.id}
          active={!!track.selected}
          label={trackLabel(track)}
          onClick={() => { onSelect(track.id); onClose(); }}
        />
      ))}

      {/* No tracks available */}
      {tracks.length === 0 && (
        <p className="text-[var(--color-text-primary)]/[0.35] text-sm px-4 pt-1 m-0">
          {t('player.noTracksAvailable')}
        </p>
      )}
    </div>
  );
}
