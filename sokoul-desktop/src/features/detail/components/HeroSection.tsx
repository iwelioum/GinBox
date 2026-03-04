// components/detail/HeroSection.tsx — Exact replica of Detail.js hero layout
// Background image fixed · Logo/title left-aligned · Play/Trailer/AddList controls
// SubTitle (year · runtime · rating · genres) · Description · GenreTags

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2 } from 'lucide-react';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface HeroSectionProps {
  item:              CatalogMeta;
  theme:             GenreTheme;
  logoUrl?:          string;
  isFavorite?:       boolean;
  isAddingToList?:   boolean;
  isPlayLoading?:    boolean;
  onPlay?:           () => void;
  onDownload?:       () => void;
  onToggleFavorite?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme: _theme, logoUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const title = item.title || item.name || '';

  // Metadata subtitle — exact Detail.js style: year · runtime · rating · genres
  const year = (item.release_date || item.first_air_date || item.releaseInfo || '').toString().slice(0, 4);
  const runtime = item.runtime
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : '';
  const rating = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : '';
  const genreNames: string[] = (item.genres ?? []).map(g =>
    typeof g === 'string' ? g : (g as { name: string }).name
  );
  const genres = genreNames.join(' · ');
  const subTitle = [year, runtime, rating, genres].filter(Boolean).join('   ·   ');

  return (
    <>
      {/* ImageTitle — exact Detail.js: height 30vw, min-height 170px, flex-end, left-aligned */}
      <div
        style={{
          alignItems: 'flex-end',
          display: 'flex',
          justifyContent: 'flex-start',
          margin: '0px auto',
          height: '30vw',
          minHeight: 170,
          paddingBottom: 24,
          width: '100%',
        }}
      >
        {logoUrl ? (
          <img
            alt={title}
            src={logoUrl}
            style={{ maxWidth: 600, minWidth: 200, width: '35vw' }}
          />
        ) : (
          <h1
            style={{
              color: '#f9f9f9',
              fontSize: '4vw',
              fontWeight: 'bold',
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
              letterSpacing: 2,
              margin: 0,
            }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* ContentMeta — exact Detail.js: max-width 874px */}
      <div style={{ maxWidth: 874 }}>
        {/* Controls — exact Detail.js */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexFlow: 'row nowrap',
            margin: '24px 0',
            minHeight: 56,
          }}
        >
          {/* Play button */}
          <button
            type="button"
            onClick={onPlay}
            disabled={isPlayLoading}
            style={{
              fontSize: 15,
              margin: '0 22px 0 0',
              padding: '0 24px',
              height: 56,
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '1.8px',
              textAlign: 'center',
              textTransform: 'uppercase',
              background: 'rgb(249,249,249)',
              border: 'none',
              color: 'rgb(0,0,0)',
              fontWeight: 'bold',
              transition: 'background 0.3s',
              gap: 8,
            }}
          >
            {isPlayLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} style={{ fill: 'black' }} />
            )}
            <span>{isPlayLoading ? 'Recherche...' : 'Play'}</span>
          </button>

          {/* Trailer / Download button */}
          <button
            type="button"
            onClick={onDownload}
            style={{
              fontSize: 15,
              margin: '0 22px 0 0',
              padding: '0 24px',
              height: 56,
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '1.8px',
              textAlign: 'center',
              textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgb(249,249,249)',
              color: 'rgb(249,249,249)',
              fontWeight: 'bold',
              transition: 'background 0.3s',
              gap: 8,
            }}
          >
            <Download size={18} />
            <span>Sources</span>
          </button>

          {/* AddList button — circle with + */}
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isAddingToList}
            style={{
              marginRight: 16,
              height: 44,
              width: 44,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isFavorite ? 'rgba(249,249,249,0.15)' : 'rgba(0,0,0,0.6)',
              borderRadius: '50%',
              border: `2px solid ${isFavorite ? '#f9f9f9' : 'white'}`,
              cursor: 'pointer',
              transition: 'border-color 0.3s, background-color 0.3s',
              color: '#f9f9f9',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {isFavorite ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {/* SubTitle — exact Detail.js */}
        <div style={{ color: 'rgb(249,249,249)', fontSize: 15, minHeight: 20 }}>
          {subTitle}
        </div>

        {/* Description — exact Detail.js */}
        {item.overview && (
          <div style={{ lineHeight: 1.4, fontSize: 20, padding: '16px 0', color: 'rgb(249,249,249)' }}>
            {item.overview}
          </div>
        )}

        {/* GenreTags — exact Detail.js */}
        {genreNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingBottom: 40 }}>
            {genreNames.map((name) => (
              <span
                key={name}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  color: '#f9f9f9',
                  background: '#0063e533',
                  border: '1px solid #0063e566',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
