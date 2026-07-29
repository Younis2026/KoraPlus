// Live football data service — TheSportsDB free API (no key required)
// Falls back to mock data gracefully when API is unavailable or returns nothing.

import { matches as mockMatches } from './mockData';

const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Major league IDs on TheSportsDB
export const LEAGUE_IDS = {
  epl:         '4328',
  laliga:      '4335',
  bundesliga:  '4331',
  seriea:      '4332',
  ligue1:      '4334',
  ucl:         '4480',
  uel:         '4481',
  uecl:        '4966',
  mls:         '4346',
  brasileirao: '4351',
} as const;

// Arabic league names keyed by TheSportsDB league ID
const LEAGUE_AR: Record<string, { id: string; name: string; country: string }> = {
  '4328': { id: 'epl',         name: 'الدوري الإنجليزي الممتاز', country: 'إنجلترا' },
  '4335': { id: 'laliga',      name: 'الدوري الإسباني',           country: 'إسبانيا' },
  '4331': { id: 'bundesliga',  name: 'الدوري الألماني',           country: 'ألمانيا' },
  '4332': { id: 'seriea',      name: 'الدوري الإيطالي',           country: 'إيطاليا' },
  '4334': { id: 'ligue1',      name: 'الدوري الفرنسي',            country: 'فرنسا'   },
  '4480': { id: 'ucl',         name: 'دوري أبطال أوروبا',        country: 'أوروبا'  },
  '4481': { id: 'uel',         name: 'الدوري الأوروبي',           country: 'أوروبا'  },
  '4966': { id: 'uecl',        name: 'دوري المؤتمر الأوروبي',    country: 'أوروبا'  },
  '4346': { id: 'mls',         name: 'الدوري الأمريكي الرئيسي',  country: 'أمريكا'  },
  '4351': { id: 'brasileirao', name: 'الدوري البرازيلي',           country: 'البرازيل'},
};

// Arabic team name translations (English → Arabic)
const TEAM_AR: Record<string, string> = {
  // English Premier League
  'Arsenal': 'أرسنال',
  'Chelsea': 'تشيلسي',
  'Liverpool': 'ليفربول',
  'Manchester City': 'مانشستر سيتي',
  'Manchester United': 'مانشستر يونايتد',
  'Tottenham Hotspur': 'توتنهام هوتسبر',
  'Tottenham': 'توتنهام',
  'Newcastle United': 'نيوكاسل يونايتد',
  'Aston Villa': 'أستون فيلا',
  'West Ham United': 'ويست هام يونايتد',
  'Everton': 'إيفرتون',
  'Leicester City': 'ليستر سيتي',
  'Brighton': 'برايتون',
  'Brighton & Hove Albion': 'برايتون',
  'Brentford': 'برينتفورد',
  'Wolves': 'وولفرهامبتون',
  'Wolverhampton Wanderers': 'وولفرهامبتون',
  'Crystal Palace': 'كريستال بالاس',
  'Nottingham Forest': 'نوتينغهام فورست',
  'Fulham': 'فولهام',
  'Coventry City': 'كوفنتري سيتي',
  'Burnley': 'بيرنلي',
  'Southampton': 'ساوثهامبتون',
  'Ipswich Town': 'إبسويتش تاون',
  // La Liga
  'Real Madrid': 'ريال مدريد',
  'FC Barcelona': 'برشلونة',
  'Barcelona': 'برشلونة',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Atlético Madrid': 'أتلتيكو مدريد',
  'Sevilla': 'إشبيلية',
  'Real Betis': 'ريال بيتيس',
  'Athletic Club': 'أتلتيك بيلباو',
  'Real Sociedad': 'ريال سوسيداد',
  'Villarreal': 'فياريال',
  'Valencia': 'فالنسيا',
  'Deportivo Alavés': 'آلافيس',
  'Getafe': 'خيتافي',
  'Celta Vigo': 'سيلتا فيغو',
  'Osasuna': 'أوساسونا',
  'Girona': 'جيرونا',
  'Mallorca': 'مايوركا',
  'Las Palmas': 'لاس بالماس',
  'Rayo Vallecano': 'رايو فاييكانو',
  'Leganes': 'ليغانيس',
  // Bundesliga
  'Bayern Munich': 'بايرن ميونخ',
  'Borussia Dortmund': 'بوروسيا دورتموند',
  'RB Leipzig': 'لايبزيغ',
  'Bayer Leverkusen': 'باير ليفركوزن',
  'Eintracht Frankfurt': 'آينتراخت فرانكفورت',
  'VfL Wolfsburg': 'فولفسبورغ',
  'Borussia Monchengladbach': 'بوروسيا مونشنغلادباخ',
  'Stuttgart': 'شتوتغارت',
  'VfB Stuttgart': 'شتوتغارت',
  'SC Freiburg': 'فرايبورغ',
  'Union Berlin': 'يونيون برلين',
  'Mainz 05': 'ماينز',
  'Augsburg': 'أوغسبورغ',
  'Hoffenheim': 'هوفنهايم',
  'Werder Bremen': 'فيردر بريمن',
  // Serie A
  'Inter Milan': 'إنتر ميلان',
  'Juventus': 'يوفنتوس',
  'AC Milan': 'ميلان',
  'AS Roma': 'روما',
  'Napoli': 'نابولي',
  'Lazio': 'لاتسيو',
  'Atalanta': 'أتالانتا',
  'Fiorentina': 'فيورنتينا',
  'Torino': 'تورينو',
  'Udinese': 'أودينيزي',
  'Sampdoria': 'سامبدوريا',
  'Sassuolo': 'ساسولو',
  'Cagliari': 'كالياري',
  'Verona': 'هيلاس فيرونا',
  'Como': 'كومو',
  'Bologna': 'بولونيا',
  'Monza': 'مونزا',
  // Ligue 1
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'Olympique Marseille': 'مرسيليا',
  'Marseille': 'مرسيليا',
  'Lyon': 'ليون',
  'Olympique Lyonnais': 'ليون',
  'Monaco': 'موناكو',
  'Lille': 'ليل',
  'Nice': 'نيس',
  'Lens': 'لانس',
  'Rennes': 'رين',
  'Strasbourg': 'ستراسبورغ',
  'Nantes': 'نانت',
  'Montpellier': 'مونبيلييه',
  'Toulouse': 'تولوز',
  'Brest': 'بريست',
  // Other European
  'Ajax': 'أياكس',
  'Benfica': 'بنفيكا',
  'Porto': 'بورتو',
  'Sporting CP': 'سبورتينغ لشبونة',
  'Celtic': 'سيلتيك',
  'Rangers': 'رانجرز',
  'PSV Eindhoven': 'PSV إيندهوفن',
  'Feyenoord': 'فيينورد',
  'Shakhtar Donetsk': 'شاختار دونيتسك',
  'Dynamo Kyiv': 'دينامو كييف',
  'Red Bull Salzburg': 'سالزبورغ',
  'Club Brugge': 'بروج',
  'Anderlecht': 'أندرلخت',
  'Galatasaray': 'غلطة سراي',
  'Fenerbahce': 'فنربخشة',
  'Besiktas': 'بيشكتاش',
  // Arabic leagues
  'Al Hilal': 'الهلال',
  'Al-Hilal': 'الهلال',
  'Al Nassr': 'النصر',
  'Al-Nassr': 'النصر',
  'Al Ahli': 'الأهلي',
  'Al-Ahli': 'الأهلي',
  'Al Ittihad': 'الاتحاد',
  'Al-Ittihad': 'الاتحاد',
  'Al Shabab': 'الشباب',
  'Al-Shabab': 'الشباب',
  'Al Qadsiah': 'القادسية',
  'Al Taawoun': 'التعاون',
  'Al Fateh': 'الفتح',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SportsDbEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  dateEvent: string;
  strTime: string;
  strTimestamp: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  strVenue: string;
  strPostponed: string;
}

export interface LiveMatch {
  id: string;
  homeTeam: { id: string; name: string; logo: string; country: string };
  awayTeam: { id: string; name: string; logo: string; country: string };
  league: { id: string; name: string; logo: string; country: string; season: string };
  scheduledAt: string;
  status: 'upcoming' | 'live' | 'finished' | 'postponed';
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  venue: string;
}

// ─── Simple in-memory cache ────────────────────────────────────────────────────
interface CacheEntry<T> { data: T; expireAt: number }
class SimpleCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || entry.expireAt < Date.now()) { this.store.delete(key); return null; }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expireAt: Date.now() + ttlMs });
  }
}

const cache = new SimpleCache();

// ─── HTTP helper ───────────────────────────────────────────────────────────────
async function sdbFetch<T>(endpoint: string, ttlMs = 5 * 60_000): Promise<T | null> {
  const cached = cache.get<T>(endpoint);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE}/${endpoint}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json() as T;
    cache.set(endpoint, data, ttlMs);
    return data;
  } catch {
    return null;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function teamAr(name: string): string {
  return TEAM_AR[name] ?? name;
}

function mapStatus(strStatus: string, postponed: string): LiveMatch['status'] {
  if (postponed === 'yes') return 'postponed';
  const s = (strStatus ?? '').toUpperCase();
  if (['FT', 'AET', 'AP', 'PEN'].includes(s)) return 'finished';
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BREAK'].includes(s)) return 'live';
  if (s === 'POSTP') return 'postponed';
  return 'upcoming';
}

function mapEvent(e: SportsDbEvent): LiveMatch | null {
  if (!e?.strEvent) return null;

  const leagueInfo = LEAGUE_AR[e.idLeague] ?? {
    id: `league_${e.idLeague}`,
    name: e.strLeague,
    country: '',
  };

  const homeTeamId = `t_${e.idHomeTeam}`;
  const awayTeamId = `t_${e.idAwayTeam}`;
  const homeTeamCountry = LEAGUE_AR[e.idLeague]?.country ?? '';
  const awayTeamCountry = homeTeamCountry;

  const scheduledAt = e.strTimestamp
    ? e.strTimestamp.endsWith('Z') ? e.strTimestamp : e.strTimestamp + 'Z'
    : `${e.dateEvent}T${e.strTime || '00:00:00'}Z`;

  const status = mapStatus(e.strStatus, e.strPostponed);

  // Estimate minute for live matches
  let minute: number | null = null;
  if (status === 'live') {
    const elapsed = Math.floor((Date.now() - new Date(scheduledAt).getTime()) / 60_000);
    minute = Math.min(Math.max(elapsed, 1), 90);
  }

  return {
    id: `sdb_${e.idEvent}`,
    homeTeam: {
      id: homeTeamId,
      name: teamAr(e.strHomeTeam),
      logo: e.strHomeTeamBadge ?? '',
      country: homeTeamCountry,
    },
    awayTeam: {
      id: awayTeamId,
      name: teamAr(e.strAwayTeam),
      logo: e.strAwayTeamBadge ?? '',
      country: awayTeamCountry,
    },
    league: {
      id: leagueInfo.id,
      name: leagueInfo.name,
      logo: '',
      country: leagueInfo.country,
      season: e.strSeason ?? '2025/26',
    },
    scheduledAt,
    status,
    homeScore: e.intHomeScore != null ? parseInt(String(e.intHomeScore), 10) : null,
    awayScore: e.intAwayScore != null ? parseInt(String(e.intAwayScore), 10) : null,
    minute,
    venue: e.strVenue || 'ملعب غير محدد',
  };
}

// ─── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchDayEvents(dateStr: string): Promise<LiveMatch[]> {
  const data = await sdbFetch<{ events: SportsDbEvent[] }>(
    `eventsday.php?d=${dateStr}&s=Soccer`,
    10 * 60_000  // 10-min cache for day data
  );
  if (!data?.events) return [];

  const majorLeagues = new Set(Object.keys(LEAGUE_AR));
  return data.events
    .filter(e => majorLeagues.has(e.idLeague))
    .map(mapEvent)
    .filter((m): m is LiveMatch => m !== null);
}

async function fetchLeagueNext(leagueId: string): Promise<LiveMatch[]> {
  const data = await sdbFetch<{ events: SportsDbEvent[] }>(
    `eventsnextleague.php?id=${leagueId}`,
    30 * 60_000  // 30-min cache
  );
  if (!data?.events) return [];
  return data.events.map(mapEvent).filter((m): m is LiveMatch => m !== null);
}

async function fetchLeaguePast(leagueId: string): Promise<LiveMatch[]> {
  const data = await sdbFetch<{ events: SportsDbEvent[] }>(
    `eventspastleague.php?id=${leagueId}`,
    30 * 60_000  // 30-min cache
  );
  if (!data?.events) return [];
  return data.events.map(mapEvent).filter((m): m is LiveMatch => m !== null);
}

// ─── Main export ───────────────────────────────────────────────────────────────
let lastFetchMs = 0;
let cachedAllMatches: LiveMatch[] = [];
const COMBINED_TTL_MS = 5 * 60_000; // 5 min for combined list

export async function getLiveMatches(): Promise<LiveMatch[]> {
  // Return cache if fresh
  if (Date.now() - lastFetchMs < COMBINED_TTL_MS && cachedAllMatches.length > 0) {
    return cachedAllMatches;
  }

  const now = new Date();
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow  = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter  = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const leagueIds = Object.values(LEAGUE_IDS);

  // Fan out all requests in parallel (date-based + per-league)
  const [
    yesterdayEvents,
    todayEvents,
    tomorrowEvents,
    dayAfterEvents,
    ...leagueResults
  ] = await Promise.allSettled([
    fetchDayEvents(toDateStr(yesterday)),
    fetchDayEvents(toDateStr(now)),
    fetchDayEvents(toDateStr(tomorrow)),
    fetchDayEvents(toDateStr(dayAfter)),
    ...leagueIds.flatMap(id => [fetchLeagueNext(id), fetchLeaguePast(id)]),
  ]);

  const flatten = (r: PromiseSettledResult<LiveMatch[]>): LiveMatch[] =>
    r.status === 'fulfilled' ? r.value : [];

  const all = [
    ...flatten(yesterdayEvents),
    ...flatten(todayEvents),
    ...flatten(tomorrowEvents),
    ...flatten(dayAfterEvents),
    ...leagueResults.flatMap(flatten),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = all.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Sort: live first, then upcoming by date, then finished
  deduped.sort((a, b) => {
    const order = { live: 0, upcoming: 1, finished: 2, postponed: 3 };
    const ao = order[a.status] ?? 4;
    const bo = order[b.status] ?? 4;
    if (ao !== bo) return ao - bo;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  // If we got real data, cache it; otherwise return mock
  if (deduped.length > 0) {
    cachedAllMatches = deduped;
    lastFetchMs = Date.now();
    return deduped;
  }

  // Fallback: return mock matches (already typed-compatible)
  return mockMatches as unknown as LiveMatch[];
}

/**
 * Returns the best set of matches to show — live data merged with mock fallback.
 * If API returns enough data (≥3 matches), we use it exclusively.
 * Otherwise we merge: real data first, then mock data to pad to minimum 6 entries.
 */
export async function getMatchesMerged(): Promise<LiveMatch[]> {
  const live = await getLiveMatches();
  if (live.length >= 3 && live !== (mockMatches as unknown as LiveMatch[])) {
    return live;
  }
  // Pad with mock
  const mockConverted = (mockMatches as unknown as LiveMatch[]);
  const combined = [...live];
  for (const m of mockConverted) {
    if (!combined.find(x => x.id === m.id)) combined.push(m);
  }
  return combined;
}

/** Generate auto-news from recent real match results */
export async function getResultsBasedNews(): Promise<Array<{
  id: string; title: string; summary: string; category: string;
  imageUrl: string; publishedAt: string; teamId: string | null;
  leagueId: string | null; isBreaking: boolean; readTimeMinutes: number;
}>> {
  const matches = await getLiveMatches();
  const finished = matches.filter(m => m.status === 'finished').slice(0, 5);

  return finished.map(m => {
    const homeWon  = (m.homeScore ?? 0) > (m.awayScore ?? 0);
    const awayWon  = (m.awayScore ?? 0) > (m.homeScore ?? 0);
    const isDraw   = m.homeScore === m.awayScore;

    let title: string;
    let summary: string;
    const score = `${m.homeScore ?? '?'}-${m.awayScore ?? '?'}`;

    if (isDraw) {
      title   = `تعادل مثير بين ${m.homeTeam.name} و${m.awayTeam.name} بنتيجة ${score}`;
      summary = `انتهت مباراة ${m.homeTeam.name} أمام ${m.awayTeam.name} بالتعادل ${score} ضمن منافسات ${m.league.name}. قدّم الفريقان أداءً متكافئاً في لقاء مثير.`;
    } else {
      const winner = homeWon ? m.homeTeam.name : m.awayTeam.name;
      const loser  = homeWon ? m.awayTeam.name : m.homeTeam.name;
      title   = `${winner} يتغلب على ${loser} بنتيجة ${score}`;
      summary = `حقق ${winner} فوزاً مهماً على حساب ${loser} بنتيجة ${score} ضمن ${m.league.name}، في نتيجة تُعزز مكانته في قمة الترتيب.`;
    }

    return {
      id: `result_${m.id}`,
      title,
      summary,
      category: 'breaking' as const,
      imageUrl: m.homeTeam.logo || m.awayTeam.logo || '',
      publishedAt: new Date(m.scheduledAt).toISOString(),
      teamId: m.homeTeam.id,
      leagueId: m.league.id,
      isBreaking: false,
      readTimeMinutes: 2,
    };
  });
}
