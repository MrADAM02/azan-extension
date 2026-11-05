import type { Settings } from './schema';

const locale = (s: Settings) => (s.display.language === 'ar' ? 'ar' : 'en');

export function fmtTime(d: Date, tz: string, s: Settings, withSeconds = false) {
  return new Intl.DateTimeFormat(locale(s), {
    hour: 'numeric',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: s.display.clock === '12h',
    timeZone: tz,
  }).format(d);
}

export function fmtGregorian(d: Date, tz: string, s: Settings) {
  return new Intl.DateTimeFormat(locale(s), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(d);
}

export function fmtHijri(d: Date, tz: string, s: Settings) {
  const shifted = new Date(d.getTime() + s.display.hijriOffset * 86_400_000);
  return new Intl.DateTimeFormat(`${locale(s)}-u-ca-islamic-umalqura`, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(shifted);
}

export function fmtCountdown(ms: number, s: Settings) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const nf = new Intl.NumberFormat(locale(s), { minimumIntegerDigits: 2, useGrouping: false });
  return `${nf.format(h)}:${nf.format(m)}:${nf.format(sec)}`;
}

export function fmtNumber(n: number, s: Settings, digits = 0) {
  return new Intl.NumberFormat(locale(s), { maximumFractionDigits: digits }).format(n);
}
