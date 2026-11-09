import type { RamadanInfo } from '@/lib/ramadan';
import type { Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';
import { fmtCountdown, fmtNumber, fmtTime } from '@/lib/format';

interface Props {
  info: RamadanInfo;
  settings: Settings;
  t: T;
  now: Date;
  variant: 'full' | 'compact';
}

export function RamadanCard({ info, settings: s, t, now, variant }: Props) {
  const tz = s.location!.timezone;
  const countdown = fmtCountdown(info.target.time.getTime() - now.getTime(), s);
  const label = info.target.kind === 'iftar' ? t('iftarIn') : t('suhoorEndsIn');
  const title = info.day ? t('ramadanDay', { n: fmtNumber(info.day, s) }) : t('ramadanKareem');

  if (variant === 'compact') {
    return (
      <div className="mt-2 flex items-center justify-between rounded-lg bg-white/15 px-2.5 py-1.5 text-sm">
        <span>🌙 {title}</span>
        <span>
          {label} <span className="tabular font-semibold">{countdown}</span>
        </span>
      </div>
    );
  }

  const pct = info.progress === null ? null : Math.round(Math.min(1, Math.max(0, info.progress)) * 100);
  const stat = (name: string, time: Date, highlight: boolean) => (
    <div className={`flex-1 rounded-xl px-3 py-2 ${highlight ? 'bg-white/20' : ''}`}>
      <div className="text-xs opacity-75">{name}</div>
      <div className="tabular text-lg font-semibold">{fmtTime(time, tz, s)}</div>
    </div>
  );

  return (
    <div className="w-full max-w-md rounded-2xl bg-amber-500/15 px-5 py-4 text-center ring-1 ring-amber-200/40 backdrop-blur-md">
      <div className="text-sm font-medium tracking-wide text-amber-100">🌙 {title}</div>
      <div className="mt-1 text-2xl font-semibold">
        {label} <span className="tabular">{countdown}</span>
      </div>
      {pct !== null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-amber-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-xs opacity-75">{t('fastDone', { n: fmtNumber(pct, s) })}</div>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {stat(t('imsak'), info.imsak, info.phase === 'night')}
        {stat(t('fajr'), info.fajr, false)}
        {stat(t('iftar'), info.maghrib, info.phase === 'fasting')}
      </div>
    </div>
  );
}
