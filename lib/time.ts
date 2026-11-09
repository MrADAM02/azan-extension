/** Timezone helpers built on Intl, with no dependencies (works in Node and the browser). */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 0 = Sunday … 6 = Saturday, as seen in timezone `tz`. */
export function weekdayInTz(d: Date, tz: string): number {
  return WEEKDAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d));
}

export const isFriday = (d: Date, tz: string) => weekdayInTz(d, tz) === 5;

/** Offset of `tz` from UTC at instant `at`, in ms (e.g. +3h for Asia/Riyadh). */
function tzOffsetMs(at: Date, tz: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant when the wall clock in `tz` reads y-m-d h:mi. */
export function zonedTimeToDate(y: number, m: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const off = tzOffsetMs(new Date(guess), tz);
  let at = guess - off;
  const off2 = tzOffsetMs(new Date(at), tz); // handles DST transitions between guess and result
  if (off2 !== off) at = guess - off2;
  return new Date(at);
}
