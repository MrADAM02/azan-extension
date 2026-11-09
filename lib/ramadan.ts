import { getDayTimes } from './prayer';
import { hijriParts } from './hijri';
import type { SavedLocation, Settings } from './schema';

/** Is the fast that begins at this Fajr a Ramadan fast (or is Ramadan mode forced on)? */
export function isRamadanFast(s: Settings, fajr: Date, tz: string): boolean {
  if (s.ramadan.mode === 'on') return true;
  if (s.ramadan.mode === 'off') return false;
  return hijriParts(fajr, tz, s.display.hijriOffset).month === 9;
}

export interface RamadanInfo {
  /** Day of Ramadan for the current/upcoming fast (null when mode is forced on outside Ramadan). */
  day: number | null;
  /** 'fasting' between Fajr and Maghrib; 'night' between Maghrib and the next Fajr. */
  phase: 'fasting' | 'night';
  imsak: Date;
  fajr: Date;
  maghrib: Date;
  /** What the countdown points to: Iftar while fasting, end of Suhoor (Fajr) at night. */
  target: { kind: 'iftar' | 'suhoor'; time: Date };
  /** 0..1 share of today's fast completed (only while fasting). */
  progress: number | null;
}

/** Ramadan status for the fast in progress or about to start, or null if not applicable. */
export function ramadanInfo(s: Settings, loc: SavedLocation, now = new Date()): RamadanInfo | null {
  if (s.ramadan.mode === 'off') return null;
  const tz = loc.timezone;
  const pick = (offset: number, key: 'fajr' | 'maghrib') =>
    getDayTimes(s, loc, offset, now).find((e) => e.key === key)?.time;
  const f0 = pick(0, 'fajr');
  const m0 = pick(0, 'maghrib');
  if (!f0 || !m0) return null;

  const t = now.getTime();
  let fajr = f0;
  let maghrib = m0;
  let phase: RamadanInfo['phase'] = 'night';
  if (t >= f0.getTime() && t < m0.getTime()) phase = 'fasting';
  else if (t >= m0.getTime()) {
    // After Maghrib: the next fast starts with tomorrow's Fajr.
    const f1 = pick(1, 'fajr');
    const m1 = pick(1, 'maghrib');
    if (!f1 || !m1) return null;
    fajr = f1;
    maghrib = m1;
  }
  if (!isRamadanFast(s, fajr, tz)) return null;

  const h = hijriParts(fajr, tz, s.display.hijriOffset);
  return {
    day: h.month === 9 ? h.day : null,
    phase,
    imsak: new Date(fajr.getTime() - s.ramadan.imsakMinutes * 60_000),
    fajr,
    maghrib,
    target: phase === 'fasting' ? { kind: 'iftar', time: maghrib } : { kind: 'suhoor', time: fajr },
    progress:
      phase === 'fasting' ? (t - fajr.getTime()) / (maghrib.getTime() - fajr.getTime()) : null,
  };
}
