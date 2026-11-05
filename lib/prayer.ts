import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';
import { PRAYERS, type MethodKey, type PrayerKey, type SavedLocation, type Settings } from './schema';

export interface PrayerEvent {
  key: PrayerKey;
  time: Date;
}

const METHODS: Record<MethodKey, () => CalculationParameters> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  Qatar: CalculationMethod.Qatar,
  Kuwait: CalculationMethod.Kuwait,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Singapore: CalculationMethod.Singapore,
  Turkey: CalculationMethod.Turkey,
  Tehran: CalculationMethod.Tehran,
};

function buildParams(s: Settings, coords: Coordinates): CalculationParameters {
  const p = METHODS[s.method]();
  p.madhab = s.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule =
    s.highLat === 'auto'
      ? HighLatitudeRule.recommended(coords)
      : (s.highLat as typeof p.highLatitudeRule);
  p.adjustments = { ...s.adjustments };
  return p;
}

/** Year/month/day of `date` as seen in timezone `tz`. */
export function ymdInTz(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

/** Prayer times for the location's calendar day (today + dayOffset, in the location's timezone). */
export function getDayTimes(
  s: Settings,
  loc: SavedLocation,
  dayOffset = 0,
  now = new Date(),
): PrayerEvent[] {
  const { y, m, d } = ymdInTz(now, loc.timezone);
  // adhan reads the local Y/M/D components of this Date, so build it from the city's date.
  const date = new Date(y, m - 1, d + dayOffset, 12);
  const coords = new Coordinates(loc.lat, loc.lng);
  const pt = new PrayerTimes(coords, date, buildParams(s, coords));
  return PRAYERS.map((key) => ({ key, time: pt[key] })).filter(
    (e) => e.time instanceof Date && !Number.isNaN(e.time.getTime()),
  );
}

/** The prayer currently in progress (null between sunrise and dhuhr) and the next one. */
export function currentAndNext(s: Settings, loc: SavedLocation, now = new Date()) {
  const all = [-1, 0, 1].flatMap((o) => getDayTimes(s, loc, o, now));
  const t = now.getTime();
  const past = all.filter((e) => e.time.getTime() <= t);
  const last = past[past.length - 1];
  const current = last && last.key !== 'sunrise' ? last : null;
  const next = all.find((e) => e.time.getTime() > t && e.key !== 'sunrise') ?? null;
  return { current, next };
}

export function qiblaDirection(loc: SavedLocation): number {
  return Qibla(new Coordinates(loc.lat, loc.lng));
}
