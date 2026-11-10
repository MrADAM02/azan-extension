import { describe, expect, it } from 'vitest';
import { currentAndNext, getDayTimes, qiblaDirection } from '@/lib/prayer';
import type { MethodKey, SavedLocation } from '@/lib/schema';
import { hm, settings } from './helpers';

// Reference values for 5 Nov 2026, checked against published timetables for each city.
const cases: [SavedLocation, MethodKey, Record<string, string>, number][] = [
  [
    { city: 'Makkah', lat: 21.4225, lng: 39.8262, timezone: 'Asia/Riyadh' },
    'UmmAlQura',
    { fajr: '05:08', sunrise: '06:26', dhuhr: '12:04', asr: '15:18', maghrib: '17:43', isha: '19:13' },
    324.9,
  ],
  [
    { city: 'Cairo', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
    'Egyptian',
    { fajr: '04:43', sunrise: '06:12', dhuhr: '11:40', asr: '14:42', maghrib: '17:05', isha: '18:24' },
    136.1,
  ],
  [
    { city: 'London', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
    'MuslimWorldLeague',
    { fajr: '05:07', sunrise: '07:01', dhuhr: '11:45', asr: '13:59', maghrib: '16:27', isha: '18:14' },
    119.0,
  ],
  [
    { city: 'New York', lat: 40.7128, lng: -74.006, timezone: 'America/New_York' },
    'NorthAmerica',
    { fajr: '05:14', sunrise: '06:31', dhuhr: '11:41', asr: '14:24', maghrib: '16:48', isha: '18:05' },
    58.5,
  ],
];

const now = new Date('2026-11-05T12:00:00Z');
const timesOf = (s: ReturnType<typeof settings>, loc: SavedLocation) =>
  Object.fromEntries(getDayTimes(s, loc, 0, now).map((e) => [e.key, hm(e.time, loc.timezone)]));

describe('prayer times', () => {
  it.each(cases)('$city', (loc, method, expected, qibla) => {
    expect(timesOf(settings(method), loc)).toEqual(expected);
    expect(qiblaDirection(loc)).toBeCloseTo(qibla, 1);
  });

  it('applies per-prayer minute adjustments', () => {
    const [loc] = cases[0]!;
    const s = settings('UmmAlQura', { adjustments: { ...settings().adjustments, fajr: 3, isha: -2 } });
    expect(timesOf(s, loc)).toMatchObject({ fajr: '05:11', isha: '19:11' });
  });

  it('Hanafi Asr is later than Shafi', () => {
    const [loc] = cases[2]!;
    const asr = (madhab: 'shafi' | 'hanafi') =>
      getDayTimes(settings('MuslimWorldLeague', { madhab }), loc, 0, now).find((e) => e.key === 'asr')!.time;
    expect(asr('hanafi').getTime()).toBeGreaterThan(asr('shafi').getTime());
  });
});

describe('current and next prayer', () => {
  const [makkah] = cases[0]!;
  const s = settings();

  it('mid-afternoon: current Dhuhr, next Asr', () => {
    const r = currentAndNext(s, makkah, now); // 15:00 in Makkah
    expect([r.current?.key, r.next?.key]).toEqual(['dhuhr', 'asr']);
  });

  it('between sunrise and Dhuhr there is no current prayer', () => {
    const r = currentAndNext(s, makkah, new Date('2026-11-05T05:00:00Z')); // 08:00
    expect(r.current).toBeNull();
    expect(r.next?.key).toBe('dhuhr');
  });

  it("after Isha the next prayer is tomorrow's Fajr", () => {
    const r = currentAndNext(s, makkah, new Date('2026-11-05T20:00:00Z')); // 23:00
    expect(r.current?.key).toBe('isha');
    expect(r.next?.key).toBe('fajr');
    expect(r.next!.time.toISOString().slice(0, 10)).toBe('2026-11-06');
  });
});
