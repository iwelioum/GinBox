// catalogFilterConstants.ts — UI preset data for catalog filter sections

import type { ContentKind, SeriesStatus } from '@/shared/utils/contentKind';
import type { UserWatchStatus } from '@/shared/types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, Clapperboard, Circle, Clock3, Film, LoaderCircle,
  Scissors, Sparkles, Square, Star, Tv, XCircle,
  CheckCircle2, Eye, PauseCircle, PlayCircle, RotateCcw, Trash2,
} from 'lucide-react';
import { YEAR_MAX } from './catalogFilterTypes';

/* ─── Provider display ─── */

export const PROVIDER_DISPLAY: Record<string, { nameKey: string; flag: string; color: string }> = {
  netflix:     { nameKey: 'filters.providerNetflix',     flag: 'INTL', color: '#E50914' },
  disney_plus: { nameKey: 'filters.providerDisneyPlus',  flag: 'INTL', color: '#113CCF' },
  prime_video: { nameKey: 'filters.providerPrimeVideo',  flag: 'INTL', color: '#00A8E1' },
  apple_tv:    { nameKey: 'filters.providerAppleTV',     flag: 'INTL', color: '#555555' },
  hbo_max:     { nameKey: 'filters.providerHBOMax',      flag: 'INTL', color: '#002BE7' },
  hulu:        { nameKey: 'filters.providerHulu',        flag: 'US',   color: '#1CE783' },
  canal_plus:  { nameKey: 'filters.providerCanalPlus',   flag: 'FR',   color: '#000000' },
  ocs:         { nameKey: 'filters.providerOCS',         flag: 'FR',   color: '#FF6900' },
  arte:        { nameKey: 'filters.providerArte',        flag: 'FR',   color: '#C8161D' },
  france_tv:   { nameKey: 'filters.providerFranceTV',    flag: 'FR',   color: '#005FA9' },
  paramount:   { nameKey: 'filters.providerParamount',   flag: 'INTL', color: '#0064FF' },
  crunchyroll: { nameKey: 'filters.providerCrunchyroll', flag: 'INTL', color: '#F47521' },
  mubi:        { nameKey: 'filters.providerMubi',        flag: 'INTL', color: '#7B2D8B' },
  youtube:     { nameKey: 'filters.providerYouTube',     flag: 'INTL', color: '#FF0000' },
};

/* ─── Decade presets ─── */

export const DECADE_PRESETS: { labelKey: string; range: [number, number] }[] = [
  { labelKey: 'filters.decadeClassics', range: [1920, 1979] },
  { labelKey: 'filters.decade80s',      range: [1980, 1989] },
  { labelKey: 'filters.decade90s',      range: [1990, 1999] },
  { labelKey: 'filters.decade2000s',    range: [2000, 2009] },
  { labelKey: 'filters.decade2010s',    range: [2010, 2019] },
  { labelKey: 'filters.decade2020Plus', range: [2020, YEAR_MAX] },
];

/* ─── Series / user status UI ─── */

export const SERIES_STATUS_UI: { value: SeriesStatus; labelKey: string; sublabelKey: string }[] = [
  { value: 'returning', labelKey: 'filters.statusOngoing',   sublabelKey: 'filters.statusOngoingSub'   },
  { value: 'ended',     labelKey: 'filters.statusEnded',     sublabelKey: 'filters.statusEndedSub'     },
  { value: 'canceled',  labelKey: 'filters.statusCanceled',  sublabelKey: 'filters.statusCanceledSub'  },
  { value: 'planned',   labelKey: 'filters.statusUpcoming',  sublabelKey: 'filters.statusUpcomingSub'  },
  { value: 'inprod',    labelKey: 'filters.statusInProd',    sublabelKey: 'filters.statusInProdSub'    },
];

export const USER_STATUS_UI: { value: UserWatchStatus; labelKey: string; sublabelKey: string }[] = [
  { value: 'plan_to_watch', labelKey: 'filters.userPlanned',    sublabelKey: 'filters.userPlannedSub'    },
  { value: 'in_progress',   labelKey: 'filters.userInProgress', sublabelKey: 'filters.userInProgressSub' },
  { value: 'to_resume',     labelKey: 'filters.userToResume',   sublabelKey: 'filters.userToResumeSub'   },
  { value: 'completed',     labelKey: 'filters.userCompleted',  sublabelKey: 'filters.userCompletedSub'  },
  { value: 'on_hold',       labelKey: 'filters.userOnHold',     sublabelKey: 'filters.userOnHoldSub'     },
  { value: 'dropped',       labelKey: 'filters.userDropped',    sublabelKey: 'filters.userDroppedSub'    },
  { value: 'unwatched',     labelKey: 'filters.userNotStarted', sublabelKey: 'filters.userNotStartedSub' },
];

/* ─── Language / country maps ─── */

export const LANGUAGE_MAP: Record<string, { labelKey: string }> = {
  fr: { labelKey: 'filters.langFrench' },     en: { labelKey: 'filters.langEnglish' },
  ja: { labelKey: 'filters.langJapanese' },    ko: { labelKey: 'filters.langKorean' },
  es: { labelKey: 'filters.langSpanish' },     de: { labelKey: 'filters.langGerman' },
  it: { labelKey: 'filters.langItalian' },     pt: { labelKey: 'filters.langPortuguese' },
  zh: { labelKey: 'filters.langChinese' },     ar: { labelKey: 'filters.langArabic' },
  ru: { labelKey: 'filters.langRussian' },     hi: { labelKey: 'filters.langHindi' },
  tr: { labelKey: 'filters.langTurkish' },     nl: { labelKey: 'filters.langDutch' },
  sv: { labelKey: 'filters.langSwedish' },     da: { labelKey: 'filters.langDanish' },
  no: { labelKey: 'filters.langNorwegian' },   fi: { labelKey: 'filters.langFinnish' },
  pl: { labelKey: 'filters.langPolish' },      th: { labelKey: 'filters.langThai' },
  id: { labelKey: 'filters.langIndonesian' },  he: { labelKey: 'filters.langHebrew' },
  cs: { labelKey: 'filters.langCzech' },       hu: { labelKey: 'filters.langHungarian' },
};

export const COUNTRY_MAP: Record<string, { labelKey: string }> = {
  US: { labelKey: 'filters.countryUS' },  GB: { labelKey: 'filters.countryGB' },
  FR: { labelKey: 'filters.countryFR' },  JP: { labelKey: 'filters.countryJP' },
  KR: { labelKey: 'filters.countryKR' },  DE: { labelKey: 'filters.countryDE' },
  IT: { labelKey: 'filters.countryIT' },  ES: { labelKey: 'filters.countryES' },
  CN: { labelKey: 'filters.countryCN' },  IN: { labelKey: 'filters.countryIN' },
  CA: { labelKey: 'filters.countryCA' },  AU: { labelKey: 'filters.countryAU' },
  MX: { labelKey: 'filters.countryMX' },  BR: { labelKey: 'filters.countryBR' },
  RU: { labelKey: 'filters.countryRU' },  SE: { labelKey: 'filters.countrySE' },
  DK: { labelKey: 'filters.countryDK' },  NO: { labelKey: 'filters.countryNO' },
  BE: { labelKey: 'filters.countryBE' },  NL: { labelKey: 'filters.countryNL' },
  PL: { labelKey: 'filters.countryPL' },  IL: { labelKey: 'filters.countryIL' },
  TR: { labelKey: 'filters.countryTR' },  TH: { labelKey: 'filters.countryTH' },
};

export function getLangMeta(code: string) {
  return LANGUAGE_MAP[code] ?? { labelKey: code.toUpperCase() };
}

export function getCountryMeta(code: string) {
  return COUNTRY_MAP[code] ?? { labelKey: code.toUpperCase() };
}

/* ─── Visibility limits ─── */

export const GENRE_VISIBLE_LIMIT   = 12;
export const COUNTRY_VISIBLE_LIMIT = 8;

/* ─── Rating / vote / popularity presets ─── */

export const RATING_PRESETS: { labelKey: string; min: number; color: string }[] = [
  { labelKey: 'filters.excellentRating', min: 8, color: 'text-emerald-400' },
  { labelKey: 'filters.veryGoodRating',  min: 7, color: 'text-green-400'   },
  { labelKey: 'filters.goodRating',      min: 6, color: 'text-yellow-400'  },
  { labelKey: 'filters.decentRating',    min: 5, color: 'text-orange-400'  },
  { labelKey: 'common.all',             min: 0, color: 'text-white/30'    },
];

export const VOTE_PRESETS: { labelKey: string; min: number; tooltipKey: string }[] = [
  { labelKey: 'filters.voteCount10000', min: 10000, tooltipKey: 'filters.voteVeryPopular'  },
  { labelKey: 'filters.voteCount1000',  min: 1000,  tooltipKey: 'filters.votePopular'       },
  { labelKey: 'filters.voteCount500',   min: 500,   tooltipKey: 'filters.voteFairlyReliable' },
  { labelKey: 'filters.voteCount100',   min: 100,   tooltipKey: 'filters.voteUnreliable'     },
  { labelKey: 'common.all',            min: 0,     tooltipKey: 'filters.voteIncludesFew'    },
];

export const POPULARITY_PRESETS: { labelKey: string; topN: number | null }[] = [
  { labelKey: 'filters.popularityTop50',  topN: 50   },
  { labelKey: 'filters.popularityTop100', topN: 100  },
  { labelKey: 'filters.popularityTop250', topN: 250  },
  { labelKey: 'filters.popularityTop500', topN: 500  },
  { labelKey: 'common.all',             topN: null },
];

/* ─── Duration / structure presets ─── */

export const MOVIE_RUNTIME_PRESETS: { labelKey: string; sublabelKey: string; range: [number, number] }[] = [
  { labelKey: 'filters.durationShort',    sublabelKey: 'filters.durationShortSub',    range: [0, 89]    },
  { labelKey: 'filters.durationStandard', sublabelKey: 'filters.durationStandardSub', range: [90, 120]  },
  { labelKey: 'filters.durationLong',     sublabelKey: 'filters.durationLongSub',     range: [121, 150] },
  { labelKey: 'filters.durationVeryLong', sublabelKey: 'filters.durationVeryLongSub', range: [151, 999] },
];

export const SEASONS_PRESETS: { labelKey: string; sublabelKey: string; range: [number, number] }[] = [
  { labelKey: 'filters.seasonsMiniSeries', sublabelKey: 'filters.seasonsMiniSeriesSub', range: [1, 1]    },
  { labelKey: 'filters.seasonsShort',      sublabelKey: 'filters.seasonsShortSub',      range: [2, 3]    },
  { labelKey: 'filters.seasonsMedium',     sublabelKey: 'filters.seasonsMediumSub',     range: [4, 6]    },
  { labelKey: 'filters.seasonsLong',       sublabelKey: 'filters.seasonsLongSub',       range: [7, 12]   },
  { labelKey: 'filters.seasonsSaga',       sublabelKey: 'filters.seasonsSagaSub',       range: [13, 999] },
];

export const EPISODE_RUNTIME_PRESETS: { labelKey: string; sublabelKey: string; range: [number, number] }[] = [
  { labelKey: 'filters.episodeSitcom', sublabelKey: 'filters.episodeSitcomSub', range: [0, 35]   },
  { labelKey: 'filters.episodeDrama',  sublabelKey: 'filters.episodeDramaSub',  range: [36, 65]  },
  { labelKey: 'filters.episodeEpic',   sublabelKey: 'filters.episodeEpicSub',   range: [66, 999] },
];

/* ─── Icon maps ─── */

export const KIND_ICONS: Partial<Record<ContentKind, LucideIcon>> = {
  movie: Film, tv: Tv, anime: Sparkles, animation: Clapperboard,
  documentary: Film, miniseries: Tv, short: Scissors, reality: Activity, special: Star,
};

export const SERIES_STATUS_ICONS: Record<SeriesStatus, LucideIcon> = {
  returning: Activity, ended: Square, canceled: XCircle,
  planned: Clock3, inprod: LoaderCircle, pilot: Clapperboard, unknown: Circle,
};

export const USER_STATUS_ICONS: Record<UserWatchStatus, LucideIcon> = {
  plan_to_watch: Star, in_progress: PlayCircle, to_resume: RotateCcw,
  completed: CheckCircle2, on_hold: PauseCircle, dropped: Trash2, unwatched: Eye,
};
