import { useMemo, useState } from 'react';
import { useDocumentTheme, useSettings, useT } from '@/lib/hooks';
import { ymdInTz } from '@/lib/prayer';
import { fmtNumber, fmtTime } from '@/lib/format';
import { buildTimetable, civil, type CivilDate, type MonthView } from '@/lib/timetable';
import { PRAYERS, type PrayerKey, type Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';

const btn =
  'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800';

export default function App() {
  const s = useSettings();
  const t = useT(s);
  useDocumentTheme(s);
  if (!s) return null;
  if (!s.location) {
    return <p className="p-8 text-slate-700 dark:text-slate-200">{t('welcomeSub')}</p>;
  }
  return <Timetable s={s} t={t} />;
}

function Timetable({ s, t }: { s: Settings; t: T }) {
  const loc = s.location!;
  const tz = loc.timezone;
  const lang = s.display.language;
  const today = useMemo(() => {
    const { y, m, d } = ymdInTz(new Date(), tz);
    return civil(y, m, d);
  }, [tz]);
  const [view, setView] = useState<MonthView>('gregorian');
  const [anchor, setAnchor] = useState<CivilDate>(today);
  const table = useMemo(() => buildTimetable(s, loc, view, anchor), [s, loc, view, anchor]);
  const cols = PRAYERS.filter((k) => k !== 'sunrise' || s.display.showSunrise);
  const showImsak = table.hasRamadan;

  // Title: "November 2026" or "Jumada al-Ula 1448 AH" (from a mid-month day so it can't straddle months).
  const mid = table.rows[Math.floor(table.rows.length / 2)]!;
  const title =
    view === 'gregorian'
      ? new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(mid.date)
      : new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, { month: 'long', year: 'numeric', timeZone: tz }).format(
          new Date((mid.times.dhuhr ?? mid.date).getTime() + s.display.hijriOffset * 86_400_000),
        );

  const fmtDay = (c: CivilDate) =>
    new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(c);
  const fmtHijriDay = (r: (typeof table.rows)[number]) =>
    view === 'hijri'
      ? fmtNumber(r.hijri.day, s)
      : new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'short', timeZone: tz }).format(
          new Date((r.times.dhuhr ?? r.date).getTime() + s.display.hijriOffset * 86_400_000),
        );
  const time = (d?: Date) => (d ? fmtTime(d, tz, s) : '—');
  const colName = (k: PrayerKey) => t.prayer(k);

  function exportCsv() {
    const csvSettings: Settings = { ...s, display: { ...s.display, clock: '24h', language: 'en' } };
    const head = ['Date', 'Hijri', ...(showImsak ? ['Imsak'] : []), ...cols.map((k) => k[0]!.toUpperCase() + k.slice(1))];
    const lines = table.rows.map((r) => [
      r.date.toISOString().slice(0, 10),
      `${r.hijri.year}-${String(r.hijri.month).padStart(2, '0')}-${String(r.hijri.day).padStart(2, '0')}`,
      ...(showImsak ? [r.imsak ? fmtTime(r.imsak, tz, csvSettings) : ''] : []),
      ...cols.map((k) => (r.times[k] ? fmtTime(r.times[k]!, tz, csvSettings) : '')),
    ]);
    const csv = [head, ...lines].map((l) => l.join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `prayer-times-${loc.city.replace(/[^\p{L}\p{N}]+/gu, '-')}-${table.rows[0]!.date.toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 text-slate-900 dark:text-slate-100 print:max-w-none print:p-0 print:text-black">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            📅 {t('timetable')} · {title}
          </h1>
          <p className="text-sm text-slate-500 print:text-slate-700">
            📍 {loc.city}
            {loc.country ? `, ${loc.country}` : ''} · {t.method(s.method)} · {t('madhab')}:{' '}
            {t(s.madhab)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as MonthView)}
            className="rounded-lg bg-white px-2 py-1.5 text-sm ring-1 ring-slate-300 dark:bg-slate-800 dark:ring-slate-600"
          >
            <option value="gregorian">{t('gregorianMonth')}</option>
            <option value="hijri">{t('hijriMonth')}</option>
          </select>
          <button className={btn} onClick={() => setAnchor(table.prev)} aria-label="Previous month">
            {lang === 'ar' ? '→' : '←'}
          </button>
          <button className={btn} onClick={() => setAnchor(today)}>
            {t('today')}
          </button>
          <button className={btn} onClick={() => setAnchor(table.next)} aria-label="Next month">
            {lang === 'ar' ? '←' : '→'}
          </button>
          <button className={btn} onClick={() => window.print()}>
            🖨️ {t('print')}
          </button>
          <button className={btn} onClick={exportCsv}>
            ⬇️ CSV
          </button>
        </div>
      </header>

      <table className="tabular w-full border-collapse overflow-hidden rounded-xl bg-white text-sm shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 print:text-[11px] print:shadow-none print:ring-slate-400">
        <thead className="bg-emerald-700 text-white print:bg-slate-200 print:text-black">
          <tr>
            <th className="px-2 py-2 text-start font-medium">{t('date')}</th>
            <th className="px-2 py-2 text-start font-medium">{t('hijri')}</th>
            {showImsak && <th className="px-2 py-2 font-medium">{t('imsak')}</th>}
            {cols.map((k) => (
              <th key={k} className="px-2 py-2 font-medium">
                {colName(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => {
            const isToday = r.date.getTime() === today.getTime();
            return (
              <tr
                key={r.date.getTime()}
                className={`border-t border-slate-100 dark:border-slate-800 print:border-slate-300 ${
                  isToday
                    ? 'bg-emerald-100 font-semibold dark:bg-emerald-900/50 print:bg-slate-100'
                    : r.friday
                      ? 'bg-slate-50 dark:bg-slate-800/50'
                      : ''
                }`}
              >
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {fmtDay(r.date)}
                  {r.ramadan && ' 🌙'}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-slate-500 print:text-slate-700">{fmtHijriDay(r)}</td>
                {showImsak && <td className="px-2 py-1.5 text-center">{r.imsak ? time(r.imsak) : ''}</td>}
                {cols.map((k) => (
                  <td key={k} className="px-2 py-1.5 text-center">
                    {k === 'dhuhr' && r.friday ? (
                      <span title={t('jumuah')}>{time(r.times[k])}*</span>
                    ) : (
                      time(r.times[k])
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500 print:text-slate-700">
        * {t('jumuah')}
        {table.hasRamadan && ` · 🌙 ${t('ramadan')}`}
      </p>
    </div>
  );
}
