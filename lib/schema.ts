/** Pure settings types, defaults and merge logic (no browser APIs, so it is testable in Node). */
export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYERS)[number];

export const METHOD_KEYS = [
  'MuslimWorldLeague',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'Qatar',
  'Kuwait',
  'MoonsightingCommittee',
  'NorthAmerica',
  'Singapore',
  'Turkey',
  'Tehran',
] as const;
export type MethodKey = (typeof METHOD_KEYS)[number];

export type HighLatRule = 'auto' | 'middleofthenight' | 'seventhofthenight' | 'twilightangle';
export type SoundId = 'chime' | 'custom' | 'custom-fajr';

export interface SavedLocation {
  lat: number;
  lng: number;
  city: string;
  country?: string;
  countryCode?: string; // ISO 3166-1 alpha-2
  timezone: string;
}

/** Official/most common calculation method per country (others keep the current choice). */
const COUNTRY_METHOD: Record<string, MethodKey> = {
  SA: 'UmmAlQura', YE: 'UmmAlQura', BH: 'UmmAlQura',
  AE: 'Dubai', QA: 'Qatar', KW: 'Kuwait',
  EG: 'Egyptian', SD: 'Egyptian', LY: 'Egyptian', SY: 'Egyptian', LB: 'Egyptian', JO: 'Egyptian', IQ: 'Egyptian', PS: 'Egyptian',
  PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
  US: 'NorthAmerica', CA: 'NorthAmerica',
  SG: 'Singapore', MY: 'Singapore', ID: 'Singapore', BN: 'Singapore',
  TR: 'Turkey', IR: 'Tehran',
};

export function suggestMethod(countryCode: string | undefined): MethodKey | undefined {
  return countryCode ? COUNTRY_METHOD[countryCode.toUpperCase()] : undefined;
}

export interface Settings {
  location: SavedLocation | null;
  method: MethodKey;
  madhab: 'shafi' | 'hanafi';
  highLat: HighLatRule;
  adjustments: Record<PrayerKey, number>;
  perPrayer: Record<PrayerKey, { notify: boolean; azan: boolean }>;
  remindBefore: number; // minutes, 0 = off
  badge: boolean; // countdown on the toolbar icon
  jumuah: {
    remindBefore: number; // minutes before Friday dhuhr, 0 = off
    kahf: boolean; // Friday reminder to read Surat al-Kahf
    kahfTime: string; // "HH:MM" in the location's timezone
  };
  audio: {
    sound: 'chime' | 'custom';
    fajrSound: 'same' | SoundId;
    volume: number; // 0..1
    muted: boolean;
  };
  display: {
    language: 'en' | 'ar';
    clock: '12h' | '24h';
    showSeconds: boolean;
    theme: 'auto' | 'light' | 'dark';
    background: string; // preset id or 'custom'
    showSunrise: boolean;
    showWeather: boolean;
    units: 'c' | 'f';
    hijriOffset: number; // -2..2 days
    showQibla: boolean;
  };
}

const allPrayers = <T,>(v: (k: PrayerKey) => T) =>
  Object.fromEntries(PRAYERS.map((k) => [k, v(k)])) as Record<PrayerKey, T>;

export const DEFAULT_SETTINGS: Settings = {
  location: null,
  method: 'MuslimWorldLeague',
  madhab: 'shafi',
  highLat: 'auto',
  adjustments: allPrayers(() => 0),
  perPrayer: allPrayers((k) => ({ notify: k !== 'sunrise', azan: k !== 'sunrise' })),
  remindBefore: 0,
  badge: true,
  jumuah: { remindBefore: 30, kahf: true, kahfTime: '10:00' },
  audio: { sound: 'chime', fajrSound: 'same', volume: 0.8, muted: false },
  display: {
    language: 'en',
    clock: '12h',
    showSeconds: false,
    theme: 'auto',
    background: 'dynamic',
    showSunrise: true,
    showWeather: true,
    units: 'c',
    hijriOffset: 0,
    showQibla: true,
  },
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep-merge stored values over defaults so newly added settings always have a value. */
function merge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : (over as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = isObj(b) && isObj(v) ? merge(b, v) : v === undefined ? b : v;
  }
  return out as T;
}

export const withDefaults = (v: Partial<Settings> | null | undefined): Settings =>
  merge(DEFAULT_SETTINGS, v ?? {});
