import { getTimesForDate } from './prayer';
import { hijriParts } from './hijri';
import { isRamadanFast } from './ramadan';
import { zonedTimeToDate } from './time';
import type { PrayerKey, SavedLocation, Settings } from './schema';

export type MonthView = 'gregorian' | 'hijri';

/** A calendar date with no time or timezone, stored as UTC midnight. */
export type CivilDate = Date;
export const civil = (y: number, m: number, d: number): CivilDate => new Date(Date.UTC(y, m - 1, d));
const addDays = (c: CivilDate, n: number): CivilDate => new Date(c.getTime() + n * 86_400_000);

export interface TimetableRow {
  date: CivilDate;
  hijri: { year: number; month: number; day: number };
  times: Partial<Record<PrayerKey, Date>>;
  imsak?: Date;
  friday: boolean;
  ramadan: boolean;
}

export interface Timetable {
  rows: TimetableRow[];
  prev: CivilDate; // an anchor inside the previous month
  next: CivilDate; // an anchor inside the next month
  hasRamadan: boolean;
}

function hijriOf(c: CivilDate, s: Settings, tz: string) {
  const noon = zonedTimeToDate(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate(), 12, 0, tz);
  return hijriParts(noon, tz, s.display.hijriOffset);
}

/** All days of the Gregorian or Hijri month containing `anchor`. */
export function buildTimetable(s: Settings, loc: SavedLocation, view: MonthView, anchor: CivilDate): Timetable {
  const tz = loc.timezone;
  const days: CivilDate[] = [];
  if (view === 'gregorian') {
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth();
    for (let c = civil(y, m + 1, 1); c.getUTCMonth() === m; c = addDays(c, 1)) days.push(c);
  } else {
    const h = hijriOf(anchor, s, tz);
    let start = addDays(anchor, -(h.day - 1));
    // Guard against the rare case where the estimate lands one day off.
    while (hijriOf(start, s, tz).month !== h.month) start = addDays(start, 1);
    while (hijriOf(addDays(start, -1), s, tz).month === h.month) start = addDays(start, -1);
    for (let c = start; hijriOf(c, s, tz).month === h.month && days.length < 31; c = addDays(c, 1)) days.push(c);
  }

  const rows = days.map((c): TimetableRow => {
    const events = getTimesForDate(s, loc, c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate());
    const times = Object.fromEntries(events.map((e) => [e.key, e.time])) as TimetableRow['times'];
    const ramadan = !!times.fajr && s.ramadan.mode !== 'off' && isRamadanFast(s, times.fajr, tz);
    return {
      date: c,
      hijri: hijriOf(c, s, tz),
      times,
      imsak: ramadan && times.fajr ? new Date(times.fajr.getTime() - s.ramadan.imsakMinutes * 60_000) : undefined,
      friday: c.getUTCDay() === 5,
      ramadan,
    };
  });

  return {
    rows,
    prev: addDays(days[0]!, -1),
    next: addDays(days[days.length - 1]!, 1),
    hasRamadan: rows.some((r) => r.ramadan),
  };
}
