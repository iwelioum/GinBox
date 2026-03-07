// categories.config.ts — Single source of truth for all Sokoul categories.
// Changes here propagate across the entire application.
// All keys, IDs and strings are in English; i18n translations live in /locales/.

export type CategoryType     = 'genre' | 'keyword' | 'language' | 'era' | 'combo';
export type TimeOfDay        = 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';
export type Season           = 'spring' | 'summer' | 'autumn' | 'winter';
export type DayType          = 'weekday' | 'weekend';
export type ContentTypeScope = 'movie' | 'series' | 'both';

export interface Category {
  id:           string;
  label:        string;
  emoji:        string;
  type:         CategoryType;
  contentType:  ContentTypeScope;
  params:       Record<string, string>;
  group:        string;
  weight:       number;
  tagline:      string;
  accentColor?: string;
  /** Maps this category to a GENRE_THEMES key for visual theming.
   *  Genre categories are resolved automatically via TMDB ID.
   *  Set explicitly for keyword / language / era / combo categories. */
  themeKey?:    string;
  timeOfDay?:   TimeOfDay[];
  dayOfWeek?:   DayType[];
  seasons?:     Season[];
  featured?:    boolean;
  showInNav?:   boolean;
}

export const CATEGORIES: Category[] = [

  // ── Movies by genre ───────────────────────────────────────────────────────
  {
    id: 'action', label: 'Action', emoji: '⚡',
    type: 'genre', contentType: 'movie',
    params: { genre: '28' }, group: 'movies', weight: 1,
    tagline: 'Adrenaline guaranteed or your money back.',
    accentColor: '#e63946', featured: true, showInNav: true,
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'adventure', label: 'Adventure', emoji: '🧭',
    type: 'genre', contentType: 'movie',
    params: { genre: '12' }, group: 'movies', weight: 2,
    tagline: 'Every journey begins with the first frame.',
    accentColor: '#f39c12', featured: false, showInNav: true,
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'scifi', label: 'Science Fiction', emoji: '🚀',
    type: 'genre', contentType: 'movie',
    params: { genre: '878' }, group: 'movies', weight: 3,
    tagline: 'Futures you never could have imagined.',
    accentColor: '#4361ee', featured: true, showInNav: true,
  },
  {
    id: 'horror', label: 'Horror', emoji: '👻',
    type: 'genre', contentType: 'movie',
    params: { genre: '27' }, group: 'movies', weight: 4,
    tagline: "For the nights you don't want to sleep.",
    accentColor: '#8b0000', featured: true, showInNav: true,
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'thriller', label: 'Thriller', emoji: '👁️',
    type: 'genre', contentType: 'movie',
    params: { genre: '53' }, group: 'movies', weight: 5,
    tagline: "Fear doesn't always come from where you expect.",
    accentColor: '#c0392b', featured: true, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'fantasy', label: 'Fantasy', emoji: '✨',
    type: 'genre', contentType: 'movie',
    params: { genre: '14' }, group: 'movies', weight: 6,
    tagline: 'Worlds where anything is possible.',
    accentColor: '#8e44ad', featured: false, showInNav: true,
  },
  {
    id: 'crime', label: 'Crime', emoji: '🔫',
    type: 'genre', contentType: 'movie',
    params: { genre: '80' }, group: 'movies', weight: 7,
    tagline: 'Power. Betrayal. Consequences.',
    accentColor: '#2c3e50', featured: false, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'drama', label: 'Drama', emoji: '🎭',
    type: 'genre', contentType: 'movie',
    params: { genre: '18' }, group: 'movies', weight: 8,
    tagline: 'Stories that stay with you.',
    accentColor: '#8e44ad', featured: false, showInNav: true,
  },
  {
    id: 'comedy', label: 'Comedy', emoji: '😂',
    type: 'genre', contentType: 'movie',
    params: { genre: '35' }, group: 'movies', weight: 9,
    tagline: 'Because laughing feels good.',
    accentColor: '#f4d03f', featured: true, showInNav: true,
    timeOfDay: ['morning', 'afternoon', 'evening'],
    dayOfWeek: ['weekend'],
  },
  {
    id: 'romance', label: 'Romance', emoji: '❤️',
    type: 'genre', contentType: 'movie',
    params: { genre: '10749' }, group: 'movies', weight: 10,
    tagline: 'For those who still believe in happy endings.',
    accentColor: '#e91e8c', featured: false, showInNav: true,
    timeOfDay: ['evening'],
    dayOfWeek: ['weekend'],
  },
  {
    id: 'animation', label: 'Animation', emoji: '🎨',
    type: 'genre', contentType: 'movie',
    params: { genre: '16' }, group: 'movies', weight: 11,
    tagline: 'The best stories are not always real.',
    accentColor: '#ff9f43', featured: false, showInNav: true,
    timeOfDay: ['morning', 'afternoon'],
  },
  {
    id: 'family', label: 'Family', emoji: '👨‍👩‍👧',
    type: 'genre', contentType: 'movie',
    params: { genre: '10751' }, group: 'movies', weight: 12,
    tagline: 'Watch together, everyone included.',
    accentColor: '#e84393', featured: false, showInNav: true,
    timeOfDay: ['afternoon'],
    dayOfWeek: ['weekend'],
  },
  {
    id: 'documentary', label: 'Documentary', emoji: '🎬',
    type: 'genre', contentType: 'movie',
    params: { genre: '99' }, group: 'movies', weight: 13,
    tagline: 'Reality is stranger than fiction.',
    accentColor: '#2ecc71', featured: true, showInNav: true,
    timeOfDay: ['morning', 'afternoon'],
  },
  {
    id: 'history', label: 'History', emoji: '📜',
    type: 'genre', contentType: 'movie',
    params: { genre: '36' }, group: 'movies', weight: 14,
    tagline: 'What happened deserves to be seen.',
    accentColor: '#1a5276', featured: false, showInNav: true,
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'mystery', label: 'Mystery', emoji: '🔍',
    type: 'genre', contentType: 'movie',
    params: { genre: '9648' }, group: 'movies', weight: 15,
    tagline: 'You thought you figured it out. You were wrong.',
    accentColor: '#6c3483', featured: false, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'music', label: 'Music', emoji: '🎵',
    type: 'genre', contentType: 'movie',
    params: { genre: '10402' }, group: 'movies', weight: 16,
    tagline: 'When images sing.',
    accentColor: '#1db954', featured: false, showInNav: false,
  },
  {
    id: 'war', label: 'War', emoji: '⚔️',
    type: 'genre', contentType: 'movie',
    params: { genre: '10752' }, group: 'movies', weight: 17,
    tagline: 'Real stories of those who fell.',
    accentColor: '#7f8c8d', featured: false, showInNav: true,
  },
  {
    id: 'western', label: 'Western', emoji: '🤠',
    type: 'genre', contentType: 'movie',
    params: { genre: '37' }, group: 'movies', weight: 18,
    tagline: 'Justice, dust, and a setting sun.',
    accentColor: '#a04000', featured: false, showInNav: true,
  },

  // ── TV Shows by genre ──────────────────────────────────────────────────────
  {
    id: 'series-action', label: 'Action Series', emoji: '⚡',
    type: 'genre', contentType: 'series',
    params: { genre: '10759' }, group: 'series', weight: 1,
    tagline: 'Suspense episode after episode.',
    accentColor: '#e63946', featured: true, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'series-scifi', label: 'Sci-Fi & Fantasy Series', emoji: '🚀',
    type: 'genre', contentType: 'series',
    params: { genre: '10765' }, group: 'series', weight: 2,
    tagline: 'Universes that expand across entire seasons.',
    accentColor: '#4361ee', featured: false, showInNav: true,
  },
  {
    id: 'series-crime', label: 'Crime Series', emoji: '🔫',
    type: 'genre', contentType: 'series',
    params: { genre: '80' }, group: 'series', weight: 3,
    tagline: 'You start one episode. You watch ten.',
    accentColor: '#2c3e50', featured: false, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'series-drama', label: 'Drama Series', emoji: '🎭',
    type: 'genre', contentType: 'series',
    params: { genre: '18' }, group: 'series', weight: 4,
    tagline: 'Characters you never forget.',
    accentColor: '#8e44ad', featured: true, showInNav: true,
  },
  {
    id: 'series-comedy', label: 'Comedy Series', emoji: '😂',
    type: 'genre', contentType: 'series',
    params: { genre: '35' }, group: 'series', weight: 5,
    tagline: 'For evenings when you just want to smile.',
    accentColor: '#f4d03f', featured: false, showInNav: true,
    timeOfDay: ['evening'],
    dayOfWeek: ['weekend'],
  },
  {
    // genre 16 covers all animated series (Pixar, Disney, Cartoon Network, etc.)
    // For specifically Japanese anime use anime-jp (language: 'ja')
    id: 'series-animation', label: 'Animation Series', emoji: '🎨',
    type: 'genre', contentType: 'series',
    params: { genre: '16' }, group: 'series', weight: 6,
    tagline: 'Animation for all ages and every mood.',
    accentColor: '#ff9f43', featured: false, showInNav: true,
  },
  {
    id: 'series-mystery', label: 'Mystery Series', emoji: '🔍',
    type: 'genre', contentType: 'series',
    params: { genre: '9648' }, group: 'series', weight: 7,
    tagline: 'Every season finale raises more questions.',
    accentColor: '#6c3483', featured: false, showInNav: true,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'series-war', label: 'War & Politics Series', emoji: '🌍',
    type: 'genre', contentType: 'series',
    params: { genre: '10768' }, group: 'series', weight: 8,
    tagline: 'Power corrupts. The show proves it.',
    accentColor: '#546e7a', featured: false, showInNav: true,
  },
  {
    id: 'series-documentary', label: 'Documentary Series', emoji: '🎬',
    type: 'genre', contentType: 'series',
    params: { genre: '99' }, group: 'series', weight: 9,
    tagline: 'Truths that take seasons to unravel.',
    accentColor: '#2ecc71', featured: false, showInNav: true,
    timeOfDay: ['morning', 'afternoon'],
  },
  {
    id: 'series-reality', label: 'Reality TV', emoji: '📺',
    type: 'genre', contentType: 'series',
    params: { genre: '10764' }, group: 'series', weight: 10,
    tagline: 'Real life is sometimes wilder than anything.',
    accentColor: '#00bcd4', featured: false, showInNav: false,
  },
  {
    id: 'series-family', label: 'Family Series', emoji: '👨‍👩‍👧',
    type: 'genre', contentType: 'series',
    params: { genre: '10751' }, group: 'series', weight: 11,
    tagline: 'Watch together, episode after episode.',
    accentColor: '#e84393', featured: false, showInNav: false,
    timeOfDay: ['afternoon'],
    dayOfWeek: ['weekend'],
  },
  {
    id: 'series-romance', label: 'Romance Series', emoji: '❤️',
    type: 'genre', contentType: 'series',
    params: { genre: '10749' }, group: 'series', weight: 12,
    tagline: 'Love stories that unfold across episodes.',
    accentColor: '#e91e8c', featured: false, showInNav: true,
    timeOfDay: ['evening'],
    dayOfWeek: ['weekend'],
  },

  // ── World Cinema ───────────────────────────────────────────────────────────
  {
    id: 'kdrama', label: 'K-Drama', emoji: '🇰🇷',
    type: 'language', contentType: 'series',
    params: { language: 'ko' }, group: 'world', weight: 1,
    tagline: 'You will cry. And you will want more.',
    accentColor: '#c0392b', featured: true, showInNav: true,
    themeKey: 'Drama',
    timeOfDay: ['evening', 'night'],
    dayOfWeek: ['weekend'],
  },
  {
    // Language filter 'ja' targets authentic Japanese anime with precision.
    // Use series-animation (genre 16) for all animated series including Western ones.
    id: 'anime-jp', label: 'Japanese Anime', emoji: '🇯🇵',
    type: 'language', contentType: 'series',
    params: { language: 'ja' }, group: 'world', weight: 2,
    tagline: 'Worlds that exist nowhere else.',
    accentColor: '#e74c3c', featured: true, showInNav: true,
    themeKey: 'Animation',
  },
  {
    id: 'bollywood', label: 'Bollywood', emoji: '🇮🇳',
    type: 'language', contentType: 'movie',
    params: { language: 'hi' }, group: 'world', weight: 3,
    tagline: 'Colors, dances, raw emotion.',
    accentColor: '#f39c12', featured: true, showInNav: true,
    themeKey: 'Drama',
  },
  {
    id: 'cinema-fr', label: 'French Cinema', emoji: '🇫🇷',
    type: 'language', contentType: 'movie',
    params: { language: 'fr' }, group: 'world', weight: 4,
    tagline: 'The art of saying much with little.',
    accentColor: '#3498db', featured: false, showInNav: true,
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'cinema-es', label: 'Spanish Cinema', emoji: '🇪🇸',
    type: 'language', contentType: 'movie',
    params: { language: 'es' }, group: 'world', weight: 5,
    tagline: 'Passion, drama, and sunlight in every frame.',
    accentColor: '#e74c3c', featured: false, showInNav: true,
  },
  {
    id: 'cinema-it', label: 'Italian Cinema', emoji: '🇮🇹',
    type: 'language', contentType: 'movie',
    params: { language: 'it' }, group: 'world', weight: 6,
    tagline: 'La dolce vita on the big screen.',
    accentColor: '#27ae60', featured: false, showInNav: true,
  },
  {
    id: 'cinema-tr', label: 'Turkish Cinema', emoji: '🇹🇷',
    type: 'language', contentType: 'series',
    params: { language: 'tr' }, group: 'world', weight: 7,
    tagline: 'Shows that run for hours and you cannot stop watching.',
    accentColor: '#e74c3c', featured: false, showInNav: true,
  },
  {
    id: 'cinema-br', label: 'Brazilian Cinema', emoji: '🇧🇷',
    type: 'language', contentType: 'movie',
    params: { language: 'pt' }, group: 'world', weight: 8,
    tagline: 'The warmth of Brazil in every frame.',
    accentColor: '#27ae60', featured: false, showInNav: true,
  },
  {
    id: 'cinema-cn', label: 'Chinese Cinema', emoji: '🇨🇳',
    type: 'language', contentType: 'movie',
    params: { language: 'zh' }, group: 'world', weight: 9,
    tagline: 'Visual poetry and ancient epics.',
    accentColor: '#e74c3c', featured: false, showInNav: true,
  },
  {
    id: 'cinema-ir', label: 'Iranian Cinema', emoji: '🇮🇷',
    type: 'language', contentType: 'movie',
    params: { language: 'fa' }, group: 'world', weight: 10,
    tagline: 'The most awarded cinema you hear about the least.',
    accentColor: '#c0392b', featured: false, showInNav: true,
  },
  {
    id: 'nollywood', label: 'Nollywood', emoji: '🌍',
    type: 'language', contentType: 'movie',
    params: { language: 'yo' }, group: 'world', weight: 11,
    tagline: 'African cinema conquering the world.',
    accentColor: '#e67e22', featured: false, showInNav: true,
  },
  {
    id: 'cinema-pl', label: 'Polish Cinema', emoji: '🇵🇱',
    type: 'language', contentType: 'movie',
    params: { language: 'pl' }, group: 'world', weight: 12,
    tagline: 'Kieslowski, Polanski — a school like no other.',
    accentColor: '#e74c3c', featured: false, showInNav: false,
  },
  {
    // Scandinavian cinema spans Swedish (sv), Danish (da), Norwegian (nb), Finnish (fi).
    // TMDB language filter supports one code at a time — 'sv' is used as the primary identifier.
    id: 'cinema-sv', label: 'Scandinavian Cinema', emoji: '🇸🇪',
    type: 'language', contentType: 'movie',
    params: { language: 'sv' }, group: 'world', weight: 13,
    tagline: 'Dark, cold, and absolutely captivating.',
    accentColor: '#2980b9', featured: false, showInNav: true,
    seasons: ['autumn', 'winter'],
  },
  {
    id: 'cinema-gr', label: 'Greek Cinema', emoji: '🇬🇷',
    type: 'language', contentType: 'movie',
    params: { language: 'el' }, group: 'world', weight: 14,
    tagline: 'Yorgos Lanthimos changed the rules.',
    accentColor: '#2980b9', featured: false, showInNav: false,
  },
  {
    id: 'cinema-ro', label: 'Romanian Cinema', emoji: '🇷🇴',
    type: 'language', contentType: 'movie',
    params: { language: 'ro' }, group: 'world', weight: 15,
    tagline: 'The new wave shaking up film festivals.',
    accentColor: '#e74c3c', featured: false, showInNav: false,
  },
  {
    id: 'cinema-vi', label: 'Vietnamese Cinema', emoji: '🇻🇳',
    type: 'language', contentType: 'movie',
    params: { language: 'vi' }, group: 'world', weight: 16,
    tagline: 'Images that carry an entire memory.',
    accentColor: '#e74c3c', featured: false, showInNav: false,
  },

  // ── Subgenres & Keywords ───────────────────────────────────────────────────
  {
    id: 'superheroes', label: 'Superheroes', emoji: '🦸',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '9715' }, group: 'subgenres', weight: 1,
    tagline: 'Powers, battles, a destiny.',
    accentColor: '#e63946', featured: true, showInNav: true,
    themeKey: 'Action',
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'espionage', label: 'Espionage', emoji: '🕵️',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10717' }, group: 'subgenres', weight: 2,
    tagline: 'No one is really who they claim to be.',
    accentColor: '#2c3e50', featured: false, showInNav: true,
    themeKey: 'Thriller',
  },
  {
    id: 'survival', label: 'Survival', emoji: '🌿',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10183' }, group: 'subgenres', weight: 3,
    tagline: 'How far would you go to survive?',
    accentColor: '#27ae60', featured: false, showInNav: true,
    themeKey: 'Adventure',
  },
  {
    id: 'zombie', label: 'Zombie', emoji: '🧟',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '12377' }, group: 'subgenres', weight: 4,
    tagline: 'The end of the world has never been this fun.',
    accentColor: '#8b0000', featured: false, showInNav: true,
    themeKey: 'Horror',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'vampire', label: 'Vampire', emoji: '🧛',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10714' }, group: 'subgenres', weight: 5,
    tagline: 'Darkness has always been seductive.',
    accentColor: '#6c0000', featured: false, showInNav: true,
    themeKey: 'Horror',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'time-travel', label: 'Time Travel', emoji: '⏱️',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '4379' }, group: 'subgenres', weight: 6,
    tagline: 'What if you could change everything?',
    accentColor: '#4361ee', featured: false, showInNav: true,
    themeKey: 'Science Fiction',
  },
  {
    id: 'ai', label: 'Artificial Intelligence', emoji: '🤖',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '310093' }, group: 'subgenres', weight: 7,
    tagline: 'When the machine starts to think.',
    accentColor: '#4361ee', featured: false, showInNav: true,
    themeKey: 'Science Fiction',
  },
  {
    id: 'mafia', label: 'Mafia & Gangsters', emoji: '🎩',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '11130' }, group: 'subgenres', weight: 8,
    tagline: 'Power. Betrayal. Family.',
    accentColor: '#2c3e50', featured: false, showInNav: true,
    themeKey: 'Crime',
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'serial-killer', label: 'Serial Killer', emoji: '🔪',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10341' }, group: 'subgenres', weight: 9,
    tagline: 'The human mind in its darkest corners.',
    accentColor: '#1a1a1a', featured: false, showInNav: true,
    themeKey: 'Thriller',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'martial-arts', label: 'Martial Arts', emoji: '🥋',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '1568' }, group: 'subgenres', weight: 10,
    tagline: 'The body as the ultimate weapon.',
    accentColor: '#e63946', featured: false, showInNav: true,
    themeKey: 'Action',
  },
  {
    id: 'prison', label: 'Prison', emoji: '🔒',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '818' }, group: 'subgenres', weight: 11,
    tagline: 'When the walls close in around you.',
    accentColor: '#7f8c8d', featured: false, showInNav: true,
    themeKey: 'Drama',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'ghosts', label: 'Ghosts', emoji: '👻',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10265' }, group: 'subgenres', weight: 12,
    tagline: "Some don't know yet that they're gone.",
    accentColor: '#6c3483', featured: false, showInNav: true,
    themeKey: 'Horror',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'pirates', label: 'Pirates', emoji: '🏴‍☠️',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '1318' }, group: 'subgenres', weight: 13,
    tagline: 'The sea, the rum, and freedom.',
    accentColor: '#2980b9', featured: false, showInNav: false,
    themeKey: 'Adventure',
  },
  {
    id: 'found-footage', label: 'Found Footage', emoji: '📹',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '14796' }, group: 'subgenres', weight: 14,
    tagline: "You're watching. But someone is watching you too.",
    accentColor: '#1a1a1a', featured: false, showInNav: false,
    themeKey: 'Horror',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'death-games', label: 'Death Games', emoji: '🎮',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '1299' }, group: 'subgenres', weight: 15,
    tagline: "The rules are simple. Dying isn't.",
    accentColor: '#8b0000', featured: false, showInNav: true,
    themeKey: 'Thriller',
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'apocalypse', label: 'Apocalypse', emoji: '🌋',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '157927' }, group: 'subgenres', weight: 16,
    tagline: 'After the end, what remains?',
    accentColor: '#e63946', featured: false, showInNav: true,
    themeKey: 'Science Fiction',
  },
  {
    id: 'dystopia', label: 'Dystopia', emoji: '🏚️',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '155202' }, group: 'subgenres', weight: 17,
    tagline: 'Broken societies you will recognize.',
    accentColor: '#7f8c8d', featured: false, showInNav: true,
    themeKey: 'Science Fiction',
  },
  {
    id: 'true-story', label: 'Based on a True Story', emoji: '📰',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '9840' }, group: 'subgenres', weight: 18,
    tagline: "It really happened. That's the craziest part.",
    accentColor: '#27ae60', featured: false, showInNav: true,
    themeKey: 'Drama',
  },

  // ── Representation ─────────────────────────────────────────────────────────
  {
    id: 'lgbt', label: 'LGBTQ+', emoji: '🏳️‍🌈',
    type: 'keyword', contentType: 'both',
    params: { keyword: '158718' },
    group: 'representation', weight: 1,
    tagline: 'Stories that deserved to be told.',
    accentColor: '#9b59b6', featured: true, showInNav: true,
    themeKey: 'Drama',
  },
  {
    id: 'feminism', label: 'Feminism', emoji: '✊',
    type: 'keyword', contentType: 'both',
    params: { keyword: '10133' },
    group: 'representation', weight: 2,
    tagline: 'Women who refused to wait.',
    accentColor: '#e91e8c', featured: false, showInNav: true,
    themeKey: 'Drama',
  },
  {
    id: 'black-cinema', label: 'Black Cinema', emoji: '✊🏿',
    type: 'keyword', contentType: 'movie',
    params: { keyword: '10503' },
    group: 'representation', weight: 3,
    tagline: 'Voices long silenced.',
    accentColor: '#e67e22', featured: false, showInNav: true,
    themeKey: 'Drama',
  },

  // ── Editorial Combos ───────────────────────────────────────────────────────
  {
    // Resolves to Action theme (28 = Action, higher priority than 878 = Sci-Fi)
    id: 'action-scifi', label: 'Action Sci-Fi', emoji: '🚀',
    type: 'combo', contentType: 'movie',
    params: { genre: '28,878' }, group: 'editorial', weight: 1,
    tagline: 'The future is fought with fists forward.',
    accentColor: '#4361ee', featured: false, showInNav: false,
    timeOfDay: ['afternoon', 'evening'],
  },
  {
    id: 'romcom', label: 'Romantic Comedy', emoji: '💑',
    type: 'combo', contentType: 'movie',
    params: { genre: '35,10749' }, group: 'editorial', weight: 2,
    tagline: 'Laugh and fall in love at the same time.',
    accentColor: '#e91e8c', featured: false, showInNav: false,
    timeOfDay: ['evening'],
    dayOfWeek: ['weekend'],
  },
  {
    id: 'psych-thriller', label: 'Psychological Thriller', emoji: '🧠',
    type: 'combo', contentType: 'movie',
    params: { genre: '53,18' }, group: 'editorial', weight: 3,
    tagline: 'For minds that love to be disturbed.',
    accentColor: '#c0392b', featured: true, showInNav: false,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'supernatural-horror', label: 'Supernatural Horror', emoji: '👁️',
    type: 'combo', contentType: 'movie',
    params: { genre: '27,14' }, group: 'editorial', weight: 4,
    tagline: 'When fear comes from beyond.',
    accentColor: '#6c0000', featured: false, showInNav: false,
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'historical-drama', label: 'Historical Drama', emoji: '⚔️',
    type: 'combo', contentType: 'movie',
    params: { genre: '18,36' }, group: 'editorial', weight: 5,
    tagline: 'History always needs witnesses.',
    accentColor: '#1a5276', featured: false, showInNav: false,
  },
  {
    id: 'crime-thriller', label: 'Crime Thriller', emoji: '🔫',
    type: 'combo', contentType: 'movie',
    params: { genre: '80,53' }, group: 'editorial', weight: 6,
    tagline: 'When crime and tension merge.',
    accentColor: '#2c3e50', featured: false, showInNav: false,
    timeOfDay: ['evening', 'night'],
  },
  {
    id: 'dark-comedy', label: 'Dark Comedy', emoji: '🖤',
    type: 'combo', contentType: 'movie',
    params: { genre: '35,80' }, group: 'editorial', weight: 7,
    tagline: "Laughing at what you shouldn't. That's it.",
    accentColor: '#1a1a1a', featured: false, showInNav: false,
    timeOfDay: ['night', 'late-night'],
  },
  {
    id: 'war-drama', label: 'War Drama', emoji: '🎖️',
    type: 'combo', contentType: 'movie',
    params: { genre: '10752,18' }, group: 'editorial', weight: 8,
    tagline: 'Behind every battle, a human story.',
    accentColor: '#7f8c8d', featured: false, showInNav: false,
  },

  // ── By Era ─────────────────────────────────────────────────────────────────
  {
    id: 'era-silent', label: 'Silent Era', emoji: '🎞️',
    type: 'era', contentType: 'movie',
    params: { year_lte: '1929' }, group: 'era', weight: 1,
    tagline: 'Before words, there were images.',
    accentColor: '#7f8c8d', featured: false, showInNav: false,
  },
  {
    id: 'era-50s', label: '1950s', emoji: '📽️',
    type: 'era', contentType: 'movie',
    params: { year_gte: '1950', year_lte: '1959' }, group: 'era', weight: 2,
    tagline: "Hollywood's golden age.",
    accentColor: '#7f8c8d', featured: false, showInNav: false,
  },
  {
    id: 'era-60s', label: '1960s', emoji: '🌸',
    type: 'era', contentType: 'movie',
    params: { year_gte: '1960', year_lte: '1969' }, group: 'era', weight: 3,
    tagline: 'The New Wave. The revolution.',
    accentColor: '#f39c12', featured: false, showInNav: false,
  },
  {
    id: 'era-70s', label: '1970s', emoji: '🕺',
    type: 'era', contentType: 'movie',
    params: { year_gte: '1970', year_lte: '1979' }, group: 'era', weight: 4,
    tagline: 'New Hollywood. The auteurs took over.',
    accentColor: '#e67e22', featured: false, showInNav: false,
  },
  {
    id: 'era-80s', label: '1980s', emoji: '📼',
    type: 'era', contentType: 'movie',
    params: { year_gte: '1980', year_lte: '1989' }, group: 'era', weight: 5,
    tagline: 'Before smartphones, after disco.',
    accentColor: '#9b59b6', featured: false, showInNav: true,
    seasons: ['autumn', 'winter'],
  },
  {
    id: 'era-90s', label: '1990s', emoji: '💿',
    type: 'era', contentType: 'movie',
    params: { year_gte: '1990', year_lte: '1999' }, group: 'era', weight: 6,
    tagline: 'Tarantino. Kubrick. Indie cinema exploded.',
    accentColor: '#e67e22', featured: false, showInNav: true,
  },
  {
    id: 'era-2000s', label: '2000s', emoji: '📱',
    type: 'era', contentType: 'movie',
    params: { year_gte: '2000', year_lte: '2009' }, group: 'era', weight: 7,
    tagline: "Cinema's digital turning point.",
    accentColor: '#3498db', featured: false, showInNav: true,
  },
  {
    id: 'era-2010s', label: '2010s', emoji: '📲',
    type: 'era', contentType: 'movie',
    params: { year_gte: '2010', year_lte: '2019' }, group: 'era', weight: 8,
    tagline: 'The decade of expanded universes.',
    accentColor: '#2980b9', featured: false, showInNav: true,
  },
  {
    id: 'recent', label: 'New Releases', emoji: '🆕',
    type: 'era', contentType: 'movie',
    params: { year_gte: '2023' }, group: 'era', weight: 9,
    tagline: 'What everyone is watching right now.',
    accentColor: '#27ae60', featured: true, showInNav: true,
    timeOfDay: ['afternoon', 'evening'],
  },
];

export const ALL_GROUPS = [
  { key: 'movies',         label: 'Movies',          emoji: '🎬', description: 'All genres of world cinema'          },
  { key: 'series',         label: 'TV Shows',         emoji: '📺', description: 'The best series by genre'            },
  { key: 'world',          label: 'World Cinema',     emoji: '🌍', description: 'Explore the cinema of every culture' },
  { key: 'subgenres',      label: 'Subgenres',        emoji: '🎭', description: 'The categories no one else offers'   },
  { key: 'representation', label: 'Representation',   emoji: '🏳️‍🌈', description: 'Stories for everyone'             },
  { key: 'editorial',      label: 'Editorial Picks',  emoji: '✨', description: 'Our favorite genre combinations'     },
  { key: 'era',            label: 'By Era',           emoji: '⏳', description: 'Travel through time in cinema'       },
] as const;

export const getCategoryGroup = (group: string): Category[] =>
  CATEGORIES.filter(c => c.group === group)
             .sort((a, b) => a.weight - b.weight);

export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find(c => c.id === id);

export const getFeaturedCategories = (): Category[] =>
  CATEGORIES.filter(c => c.featured)
             .sort((a, b) => a.weight - b.weight);

export const getNavCategories = (): Category[] =>
  CATEGORIES.filter(c => c.showInNav);
