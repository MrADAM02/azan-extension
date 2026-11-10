import { describe, expect, it } from 'vitest';
import { hijriParts } from '@/lib/hijri';
import { makeT } from '@/lib/i18n';
import { getDayTimes } from '@/lib/prayer';
import { isFriday, weekdayInTz, zonedTimeToDate } from '@/lib/time';
import { RIYADH, settings } from './helpers';

describe('zonedTimeToDate (10:00 local)', () => {
  it.each([
    [2026, 11, 13, 'Asia/Riyadh', '2026-11-13T07:00:00.000Z'],
    [2026, 11, 1, 'America/New_York', '2026-11-01T15:00:00.000Z'], // the day DST ends
    [2026, 7, 3, 'America/New_York', '2026-07-03T14:00:00.000Z'], // summer time
    [2026, 11, 13, 'Australia/Sydney', '2026-11-12T23:00:00.000Z'], // previous UTC day
  ])('%i-%i-%i in %s', (y, m, d, tz, iso) => {
    expect(zonedTimeToDate(y, m, d, 10, 0, tz).toISOString()).toBe(iso);
  });
});

describe('weekday in a timezone', () => {
  it('the same instant is Friday in Riyadh but Thursday in New York', () => {
    const t = new Date('2026-11-12T23:30:00Z');
    expect(weekdayInTz(t, 'Asia/Riyadh')).toBe(5);
    expect(weekdayInTz(t, 'America/New_York')).toBe(4);
    expect(isFriday(t, 'Asia/Riyadh')).toBe(true);
  });

  it("Dhuhr is labelled Jumu'ah on Fridays only", () => {
    const dhuhr = (iso: string) =>
      getDayTimes(settings(), RIYADH, 0, new Date(iso)).find((e) => e.key === 'dhuhr')!.time;
    const friday = dhuhr('2026-11-13T05:00:00Z');
    const thursday = dhuhr('2026-11-12T05:00:00Z');
    expect(makeT('en').prayerAt('dhuhr', friday, RIYADH.timezone)).toBe(makeT('en')('jumuah'));
    expect(makeT('ar').prayerAt('dhuhr', friday, RIYADH.timezone)).toBe('الجمعة');
    expect(makeT('en').prayerAt('dhuhr', thursday, RIYADH.timezone)).toBe('Dhuhr');
  });
});

describe('Hijri date (Umm al-Qura)', () => {
  it('converts and applies the day offset', () => {
    const d = new Date('2026-11-09T09:00:00Z');
    expect(hijriParts(d, 'Asia/Riyadh')).toEqual({ year: 1448, month: 5, day: 29 });
    expect(hijriParts(d, 'Asia/Riyadh', 1)).toEqual({ year: 1448, month: 5, day: 30 });
  });
});
