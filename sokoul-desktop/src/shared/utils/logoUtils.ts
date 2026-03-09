import {
  getGenreStyle,
  CARD_TITLE_STYLE,
  HERO_TITLE_STYLE,
  type GenreStyle,
} from '@/shared/config/genreTypography';

/** Result when a logo image is available */
export interface LogoResult {
  kind: 'logo';
  url: string;
}

/** Result when falling back to styled text */
export interface StyledTextResult {
  kind: 'text';
  title: string;
  style: GenreStyle;
}

export type LogoOrTitle = LogoResult | StyledTextResult;

/**
 * Resolves the best visual identity for a content item.
 *
 * Priority chain:
 *   1. Fanart clearlogo (provided as logoUrl from useContentCardData)
 *   2. TMDB logo_path (provided as tmdbLogoUrl)
 *   3. Styled text title with genre-specific typography
 */
export function resolveLogoOrTitle(
  logoUrl: string | null | undefined,
  tmdbLogoUrl: string | null | undefined,
  title: string,
  genreIds: number[],
  context: 'card' | 'hero' = 'card',
): LogoOrTitle {
  const url = logoUrl || tmdbLogoUrl;
  if (url) {
    return { kind: 'logo', url };
  }

  const baseStyle = getGenreStyle(genreIds);
  const sizeOverride = context === 'hero' ? HERO_TITLE_STYLE : CARD_TITLE_STYLE;

  return {
    kind: 'text',
    title,
    style: {
      ...baseStyle,
      fontSize: sizeOverride.fontSize,
    },
  };
}
