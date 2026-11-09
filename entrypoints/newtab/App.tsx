import { useMemo } from 'react';
import { useBlobUrl, useDocumentTheme, useNow, useSettings, useT } from '@/lib/hooks';
import { currentAndNext, getDayTimes, qiblaDirection } from '@/lib/prayer';
import { fmtCountdown, fmtGregorian, fmtHijri, fmtNumber, fmtTime } from '@/lib/format';
import { backgroundCss } from '@/lib/backgrounds';
import { METHOD_KEYS, setLocation, updateSettings, type Settings } from '@/lib/settings';
import { PrayerList } from '@/components/PrayerList';
import { LocationPicker } from '@/components/LocationPicker';
import { WeatherWidget } from '@/components/WeatherWidget';
import { RamadanCard } from '@/components/RamadanCard';
import { ramadanInfo } from '@/lib/ramadan';
import { openTimetable } from '@/lib/open';
import { ContentCard } from '@/components/ContentCard';
import type { DhikrPeriod } from '@/lib/content';
import type { T } from '@/lib/i18n';

export default function App() {
  const s = useSettings();
  const t = useT(s);
  useDocumentTheme(s);
  if (!s) return null;
  return s.location ? <Dashboard s={s} t={t} /> : <Onboarding s={s} t={t} />;
}

function Dashboard({ s, t }: { s: Settings; t: T }) {
  const loc = s.location!;
  const now = useNow(1000);
  const dayKey = now.toDateString();
  // Recompute times once per day (or when settings change) rather than every second.
  const events = useMemo(() => getDayTimes(s, loc, 0, now), [s, dayKey]);
  const { current, next } = currentAndNext(s, loc, now);
  const ramadan = ramadanInfo(s, loc, now);
  // Morning adhkar from Fajr until Dhuhr, evening adhkar from Asr until Isha.
  const period: DhikrPeriod =
    current?.key === 'fajr' || (!current && next?.key === 'dhuhr')
      ? 'morning'
      : current?.key === 'asr' || current?.key === 'maghrib'
        ? 'evening'
        : 'general';
  const bgUrl = useBlobUrl('background', s.display.background === 'custom');
  const bg = bgUrl
    ? `center / cover no-repeat url("${bgUrl}")`
    : backgroundCss(s.display.background, current?.key ?? null);

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: bg }}>
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative flex min-h-screen flex-col px-6 py-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">📍 {loc.city}</div>
            {loc.country && <div className="text-sm opacity-75">{loc.country}</div>}
          </div>
          <div className="flex items-center gap-3">
            {s.display.showWeather && <WeatherWidget settings={s} t={t} />}
            <button
              onClick={() =>
                updateSettings((x) => ({ ...x, audio: { ...x.audio, muted: !x.audio.muted } }))
              }
              title={s.audio.muted ? t('unmute') : t('mute')}
              className="rounded-full bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20"
            >
              {s.audio.muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={openTimetable}
              title={t('timetable')}
              className="rounded-full bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20"
            >
              📅
            </button>
            <button
              onClick={() => browser.runtime.openOptionsPage()}
              title={t('settings')}
              className="rounded-full bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20"
            >
              ⚙️
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
          <div className="text-center drop-shadow-lg">
            <div className="tabular text-7xl font-light tracking-tight sm:text-8xl">
              {fmtTime(now, loc.timezone, s, s.display.showSeconds)}
            </div>
            <div className="mt-3 text-lg opacity-90">{fmtGregorian(now, loc.timezone, s)}</div>
            <div className="text-base opacity-75">{fmtHijri(now, loc.timezone, s)}</div>
          </div>

          {next && (
            <div className="rounded-2xl bg-white/10 px-6 py-3 text-center ring-1 ring-white/20 backdrop-blur-md">
              <div className="text-sm uppercase tracking-wider opacity-75">{t('next')}</div>
              <div className="text-2xl font-semibold">
                {t.prayerAt(next.key, next.time, loc.timezone)} {t('in')}{' '}
                <span className="tabular">{fmtCountdown(next.time.getTime() - now.getTime(), s)}</span>
              </div>
            </div>
          )}

          {ramadan && <RamadanCard info={ramadan} settings={s} t={t} now={now} variant="full" />}

          <PrayerList
            events={events}
            currentKey={current?.key ?? null}
            nextKey={next?.key ?? null}
            settings={s}
            t={t}
            variant="cards"
          />

          <ContentCard settings={s} t={t} period={period} />
        </main>

        <footer className="flex items-center justify-between text-xs opacity-70">
          <span>
            {s.display.showQibla && (
              <>
                🕋 {t('qibla')}: {fmtNumber(qiblaDirection(loc), s, 1)}°
              </>
            )}
          </span>
          {s.display.showWeather && (
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:underline">
              {t('weatherBy')}
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}

function Onboarding({ s, t }: { s: Settings; t: T }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-white"
      style={{ background: backgroundCss('night', null) }}
    >
      <div className="flex gap-2 self-end">
        {(['en', 'ar'] as const).map((l) => (
          <button
            key={l}
            onClick={() => updateSettings((x) => ({ ...x, display: { ...x.display, language: l } }))}
            className={`rounded-lg px-3 py-1 text-sm ring-1 ring-white/30 ${s.display.language === l ? 'bg-white/25' : ''}`}
          >
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
      </div>
      <div className="text-6xl" aria-hidden>
        🕌
      </div>
      <h1 className="text-4xl font-semibold">{t('welcome')}</h1>
      <p className="opacity-80">{t('welcomeSub')}</p>
      <LocationPicker
        settings={s}
        t={t}
        dark
        onPick={setLocation}
      />
      <label className="flex w-full max-w-md flex-col gap-1 text-sm">
        <span className="opacity-80">{t('method')}</span>
        <select
          value={s.method}
          onChange={(e) => updateSettings((x) => ({ ...x, method: e.target.value as Settings['method'] }))}
          className="rounded-xl bg-white/15 px-3 py-2 text-white ring-1 ring-white/30 [&>option]:text-slate-900"
        >
          {METHOD_KEYS.map((m) => (
            <option key={m} value={m}>
              {t.method(m)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
