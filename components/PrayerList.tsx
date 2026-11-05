import type { PrayerEvent } from '@/lib/prayer';
import type { PrayerKey, Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';
import { fmtTime } from '@/lib/format';

const ICONS: Record<PrayerKey, string> = {
  fajr: '🌄',
  sunrise: '🌅',
  dhuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌇',
  isha: '🌙',
};

interface Props {
  events: PrayerEvent[];
  currentKey: PrayerKey | null;
  nextKey: PrayerKey | null;
  settings: Settings;
  t: T;
  variant: 'cards' | 'rows';
}

export function PrayerList({ events, currentKey, nextKey, settings, t, variant }: Props) {
  const tz = settings.location!.timezone;
  const list = events.filter((e) => settings.display.showSunrise || e.key !== 'sunrise');

  if (variant === 'rows') {
    return (
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {list.map((e) => {
          const active = e.key === currentKey;
          const upcoming = e.key === nextKey;
          return (
            <li
              key={e.key}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                active ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : ''
              } ${upcoming ? 'font-semibold' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{ICONS[e.key]}</span>
                {t.prayer(e.key)}
              </span>
              <span className="tabular">{fmtTime(e.time, tz, settings)}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="grid w-full max-w-4xl grid-cols-3 gap-3 sm:grid-cols-6">
      {list.map((e) => {
        const active = e.key === currentKey;
        const upcoming = e.key === nextKey;
        return (
          <div
            key={e.key}
            className={`rounded-2xl px-3 py-4 text-center backdrop-blur-md transition ${
              active
                ? 'bg-white/90 text-slate-900 shadow-lg ring-2 ring-white'
                : upcoming
                  ? 'bg-white/25 ring-1 ring-white/60'
                  : 'bg-white/10 ring-1 ring-white/15'
            } ${e.key === 'sunrise' ? 'opacity-80' : ''}`}
          >
            <div className="text-2xl" aria-hidden>
              {ICONS[e.key]}
            </div>
            <div className="mt-1 text-sm font-medium opacity-90">{t.prayer(e.key)}</div>
            <div className="tabular mt-1 text-lg font-semibold">{fmtTime(e.time, tz, settings)}</div>
          </div>
        );
      })}
    </div>
  );
}
