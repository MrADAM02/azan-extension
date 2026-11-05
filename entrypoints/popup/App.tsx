import { useDocumentTheme, useNow, useSettings, useT } from '@/lib/hooks';
import { currentAndNext, getDayTimes } from '@/lib/prayer';
import { fmtCountdown, fmtHijri } from '@/lib/format';
import { updateSettings } from '@/lib/settings';
import { PrayerList } from '@/components/PrayerList';

export default function App() {
  const s = useSettings();
  const t = useT(s);
  const now = useNow(1000);
  useDocumentTheme(s);
  if (!s) return <div className="h-40 w-80" />;

  const btn =
    'rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800';

  if (!s.location) {
    return (
      <div className="w-80 space-y-3 p-4 text-slate-900 dark:text-slate-100">
        <p>{t('welcomeSub')}</p>
        <button className={btn} onClick={() => browser.tabs.create({})}>
          📍 {t('detect')}
        </button>
      </div>
    );
  }

  const loc = s.location;
  const events = getDayTimes(s, loc, 0, now);
  const { current, next } = currentAndNext(s, loc, now);

  return (
    <div className="w-80 text-slate-900 dark:text-slate-100">
      <div className="bg-emerald-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between text-xs opacity-85">
          <span>📍 {loc.city}</span>
          <span>{fmtHijri(now, loc.timezone, s)}</span>
        </div>
        {next && (
          <div className="mt-1">
            <div className="text-xs uppercase tracking-wider opacity-75">{t('next')}</div>
            <div className="text-lg font-semibold">
              {t.prayer(next.key)} {t('in')}{' '}
              <span className="tabular">{fmtCountdown(next.time.getTime() - now.getTime(), s)}</span>
            </div>
          </div>
        )}
      </div>
      <PrayerList
        events={events}
        currentKey={current?.key ?? null}
        nextKey={next?.key ?? null}
        settings={s}
        t={t}
        variant="rows"
      />
      <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <button
          className={btn}
          onClick={() => updateSettings((x) => ({ ...x, audio: { ...x.audio, muted: !x.audio.muted } }))}
        >
          {s.audio.muted ? `🔇 ${t('unmute')}` : `🔊 ${t('mute')}`}
        </button>
        <button
          className={btn}
          onClick={() => browser.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {})}
        >
          ⏹ {t('stopAzan')}
        </button>
        <button className={`${btn} ms-auto`} onClick={() => browser.runtime.openOptionsPage()}>
          ⚙️
        </button>
      </div>
    </div>
  );
}
