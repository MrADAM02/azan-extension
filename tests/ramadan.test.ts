import { describe, expect, it } from 'vitest';
import { ramadanInfo } from '@/lib/ramadan';
import { buildTimetable, civil, type Timetable } from '@/lib/timetable';
import { hm, RIYADH, settings, ymd } from './helpers';

const tz = RIYADH.timezone;
const s = settings();

describe('Ramadan 1448 in Riyadh (Umm al-Qura: 8 Feb – 8 Mar 2027)', () => {
  it('is not active the afternoon before Ramadan', () => {
    expect(ramadanInfo(s, RIYADH, new Date('2027-02-07T10:00:00Z'))).toBeNull();
  });

  it('the night before day 1 counts down to suhoor', () => {
    const r = ramadanInfo(s, RIYADH, new Date('2027-02-07T18:00:00Z'))!;
    expect(r).toMatchObject({ day: 1, phase: 'night' });
    expect(r.target.kind).toBe('suhoor');
    expect(hm(r.target.time, tz)).toBe('05:12');
    expect(hm(r.imsak, tz)).toBe('05:02'); // 10 minutes before Fajr by default
  });

  it('during day 1 counts down to iftar', () => {
    const r = ramadanInfo(s, RIYADH, new Date('2027-02-08T09:00:00Z'))!;
    expect(r).toMatchObject({ day: 1, phase: 'fasting' });
    expect(r.target.kind).toBe('iftar');
    expect(hm(r.target.time, tz)).toBe('17:43');
    expect(r.progress).toBeGreaterThan(0.5);
    expect(r.progress).toBeLessThan(0.6);
  });

  it('the evening of the last day (Eid next) is not active', () => {
    expect(ramadanInfo(s, RIYADH, new Date('2027-03-08T18:00:00Z'))).toBeNull();
  });

  it('mode "on" forces it outside Ramadan; "auto" does not', () => {
    const nov = new Date('2026-11-09T09:00:00Z');
    expect(ramadanInfo(s, RIYADH, nov)).toBeNull();
    const on = ramadanInfo(settings('UmmAlQura', { ramadan: { ...s.ramadan, mode: 'on' } }), RIYADH, nov);
    expect(on?.target.kind).toBe('iftar');
  });
});

describe('monthly timetable', () => {
  const sum = (t: Timetable) => ({
    days: t.rows.length,
    first: ymd(t.rows[0]!.date),
    last: ymd(t.rows.at(-1)!.date),
    fridays: t.rows.filter((r) => r.friday).length,
    ramadan: t.rows.filter((r) => r.ramadan).length,
    prev: ymd(t.prev),
    next: ymd(t.next),
  });

  it('Gregorian November 2026', () => {
    expect(sum(buildTimetable(s, RIYADH, 'gregorian', civil(2026, 11, 9)))).toEqual({
      days: 30,
      first: '2026-11-01',
      last: '2026-11-30',
      fridays: 4,
      ramadan: 0,
      prev: '2026-10-31',
      next: '2026-12-01',
    });
  });

  it('Gregorian February 2027 contains the start of Ramadan', () => {
    expect(sum(buildTimetable(s, RIYADH, 'gregorian', civil(2027, 2, 15)))).toMatchObject({ days: 28, ramadan: 21 });
  });

  it('Hijri month view and navigation', () => {
    const month = buildTimetable(s, RIYADH, 'hijri', civil(2026, 11, 9));
    expect(sum(month)).toMatchObject({ days: 30, first: '2026-10-12', last: '2026-11-10' });
    expect(sum(buildTimetable(s, RIYADH, 'hijri', month.next))).toMatchObject({ days: 29, first: '2026-11-11' });
  });

  it('Hijri Ramadan has Imsak times and follows the Hijri offset', () => {
    const r = buildTimetable(s, RIYADH, 'hijri', civil(2027, 2, 20));
    expect(r.hasRamadan).toBe(true);
    expect(sum(r)).toMatchObject({ days: 29, first: '2027-02-08', last: '2027-03-08', ramadan: 29 });
    const day1 = r.rows[0]!;
    expect([hm(day1.imsak, tz), hm(day1.times.fajr, tz), hm(day1.times.maghrib, tz)]).toEqual(['05:02', '05:12', '17:43']);

    const shifted = settings('UmmAlQura', { display: { ...s.display, hijriOffset: 1 } });
    expect(sum(buildTimetable(shifted, RIYADH, 'hijri', civil(2027, 2, 20))).first).toBe('2027-02-07');
  });
});
