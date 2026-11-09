import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDocumentTheme, useNow, useSettings, useT } from '@/lib/hooks';
import {
  DEFAULT_SETTINGS,
  METHOD_KEYS,
  PRAYERS,
  setLocation,
  settingsItem,
  updateSettings,
  type Settings,
  type SoundId,
} from '@/lib/settings';
import { getDayTimes } from '@/lib/prayer';
import { fmtTime } from '@/lib/format';
import { BACKGROUNDS } from '@/lib/backgrounds';
import { deleteBlob, getBlob, putBlob, type BlobKey } from '@/lib/blobStore';
import { createPlayer } from '@/lib/player';
import { LocationPicker } from '@/components/LocationPicker';
import type { T, TKey } from '@/lib/i18n';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const control =
  'rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:ring-slate-600';
const btn =
  'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800';

type Patch = (s: Settings) => Settings;

export default function App() {
  const s = useSettings();
  const t = useT(s);
  useDocumentTheme(s);
  if (!s) return null;
  const set = (fn: Patch) => updateSettings(fn);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-semibold">⚙️ {t('settings')}</h1>
      <LocationSection s={s} t={t} set={set} />
      <CalculationSection s={s} t={t} set={set} />
      <AlertsSection s={s} t={t} set={set} />
      <RamadanSection s={s} t={t} set={set} />
      <AudioSection s={s} t={t} set={set} />
      <DisplaySection s={s} t={t} set={set} />
      <button
        className={`${btn} text-red-600`}
        onClick={async () => {
          if (!confirm(t('resetConfirm'))) return;
          await settingsItem.setValue({ ...DEFAULT_SETTINGS, location: s.location });
        }}
      >
        {t('reset')}
      </button>
    </div>
  );
}

interface SectionProps {
  s: Settings;
  t: T;
  set: (fn: Patch) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-emerald-600"
    />
  );
}

function LocationSection({ s, t, set }: SectionProps) {
  const [editing, setEditing] = useState(!s.location);
  return (
    <Section title={`📍 ${t('location')}`}>
      {s.location && (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {s.location.city}
              {s.location.country ? `, ${s.location.country}` : ''}
            </div>
            <div className="text-xs text-slate-500">
              {s.location.lat.toFixed(4)}, {s.location.lng.toFixed(4)} · {s.location.timezone}
            </div>
          </div>
          <button className={btn} onClick={() => setEditing((e) => !e)}>
            {t('change')}
          </button>
        </div>
      )}
      {editing && (
        <LocationPicker
          settings={s}
          t={t}
          onPick={(location) => {
            setLocation(location);
            setEditing(false);
          }}
        />
      )}
    </Section>
  );
}

function CalculationSection({ s, t, set }: SectionProps) {
  const now = useNow(60_000);
  const times = s.location ? getDayTimes(s, s.location, 0, now) : [];
  return (
    <Section title={`🧭 ${t('calculation')}`}>
      <Row label={t('method')}>
        <select
          className={control}
          value={s.method}
          onChange={(e) => set((x) => ({ ...x, method: e.target.value as Settings['method'] }))}
        >
          {METHOD_KEYS.map((m) => (
            <option key={m} value={m}>
              {t.method(m)}
            </option>
          ))}
        </select>
      </Row>
      <Row label={t('madhab')}>
        <select
          className={control}
          value={s.madhab}
          onChange={(e) => set((x) => ({ ...x, madhab: e.target.value as Settings['madhab'] }))}
        >
          <option value="shafi">{t('shafi')}</option>
          <option value="hanafi">{t('hanafi')}</option>
        </select>
      </Row>
      <Row label={t('highLat')}>
        <select
          className={control}
          value={s.highLat}
          onChange={(e) => set((x) => ({ ...x, highLat: e.target.value as Settings['highLat'] }))}
        >
          {(['auto', 'middleofthenight', 'seventhofthenight', 'twilightangle'] as const).map((r) => (
            <option key={r} value={r}>
              {t(r)}
            </option>
          ))}
        </select>
      </Row>
      <div>
        <div className="mb-2 text-sm">{t('adjustments')}</div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {PRAYERS.map((k) => {
            const ev = times.find((e) => e.key === k);
            return (
              <label key={k} className="flex flex-col gap-1 text-center text-xs">
                <span className="font-medium">{t.prayer(k)}</span>
                <input
                  type="number"
                  min={-60}
                  max={60}
                  value={s.adjustments[k]}
                  onChange={(e) =>
                    set((x) => ({
                      ...x,
                      adjustments: { ...x.adjustments, [k]: Math.round(Number(e.target.value) || 0) },
                    }))
                  }
                  className={`${control} w-full text-center`}
                />
                {ev && s.location && (
                  <span className="tabular text-slate-500">{fmtTime(ev.time, s.location.timezone, s)}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function AlertsSection({ s, t, set }: SectionProps) {
  return (
    <Section title={`🔔 ${t('alerts')}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="py-1 text-start font-normal" />
            <th className="py-1 font-normal">{t('notify')}</th>
            <th className="py-1 font-normal">{t('azan')}</th>
          </tr>
        </thead>
        <tbody>
          {PRAYERS.map((k) => (
            <tr key={k} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-2">{t.prayer(k)}</td>
              <td className="py-2 text-center">
                <Toggle
                  checked={s.perPrayer[k].notify}
                  onChange={(v) =>
                    set((x) => ({ ...x, perPrayer: { ...x.perPrayer, [k]: { ...x.perPrayer[k], notify: v } } }))
                  }
                />
              </td>
              <td className="py-2 text-center">
                {k !== 'sunrise' && (
                  <Toggle
                    checked={s.perPrayer[k].azan}
                    onChange={(v) =>
                      set((x) => ({ ...x, perPrayer: { ...x.perPrayer, [k]: { ...x.perPrayer[k], azan: v } } }))
                    }
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Row label={t('remindBefore')}>
        <select
          className={control}
          value={s.remindBefore}
          onChange={(e) => set((x) => ({ ...x, remindBefore: Number(e.target.value) }))}
        >
          {[0, 5, 10, 15, 20, 30].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? t('off') : `${n} ${t('minutes')}`}
            </option>
          ))}
        </select>
      </Row>
      <Row label={`🕌 ${t('jumuahRemind')}`}>
        <select
          className={control}
          value={s.jumuah.remindBefore}
          onChange={(e) => set((x) => ({ ...x, jumuah: { ...x.jumuah, remindBefore: Number(e.target.value) } }))}
        >
          {[0, 15, 30, 45, 60, 90].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? t('off') : `${n} ${t('minutes')}`}
            </option>
          ))}
        </select>
      </Row>
      <Row label={`📖 ${t('kahfRemind')}`}>
        <Toggle
          checked={s.jumuah.kahf}
          onChange={(v) => set((x) => ({ ...x, jumuah: { ...x.jumuah, kahf: v } }))}
        />
      </Row>
      {s.jumuah.kahf && (
        <Row label={t('kahfTime')}>
          <input
            type="time"
            className={control}
            value={s.jumuah.kahfTime}
            onChange={(e) =>
              e.target.value && set((x) => ({ ...x, jumuah: { ...x.jumuah, kahfTime: e.target.value } }))
            }
          />
        </Row>
      )}
    </Section>
  );
}

function RamadanSection({ s, t, set }: SectionProps) {
  const r = s.ramadan;
  const setR = (patch: Partial<Settings['ramadan']>) => set((x) => ({ ...x, ramadan: { ...x.ramadan, ...patch } }));
  return (
    <Section title={`🌙 ${t('ramadan')}`}>
      <Row label={t('ramadanMode')}>
        <select className={control} value={r.mode} onChange={(e) => setR({ mode: e.target.value as Settings['ramadan']['mode'] })}>
          <option value="auto">{t('ramadanAuto')}</option>
          <option value="on">{t('alwaysOn')}</option>
          <option value="off">{t('off')}</option>
        </select>
      </Row>
      {r.mode !== 'off' && (
        <>
          <Row label={t('imsakBefore')}>
            <select className={control} value={r.imsakMinutes} onChange={(e) => setR({ imsakMinutes: Number(e.target.value) })}>
              {[0, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} {t('minutes')}
                </option>
              ))}
            </select>
          </Row>
          <Row label={t('notifyImsak')}>
            <Toggle checked={r.notifyImsak} onChange={(v) => setR({ notifyImsak: v })} />
          </Row>
          <Row label={t('suhoorRemind')}>
            <select className={control} value={r.suhoorBefore} onChange={(e) => setR({ suhoorBefore: Number(e.target.value) })}>
              {[0, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? t('off') : `${n} ${t('minutes')} ${t('beforeFajr')}`}
                </option>
              ))}
            </select>
          </Row>
        </>
      )}
    </Section>
  );
}

function FileSlot({ k, label, t, onChange }: { k: BlobKey; label: string; t: T; onChange?: () => void }) {
  const [has, setHas] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const refresh = () => getBlob(k).then((b) => setHas(!!b));
  useEffect(() => void refresh(), [k]);
  const accept = k === 'background' ? 'image/*' : 'audio/*';
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await putBlob(k, f);
          await refresh();
          onChange?.();
          e.target.value = '';
        }}
      />
      <button className={btn} onClick={() => input.current?.click()}>
        ⬆️ {label}
      </button>
      <span className="text-slate-500">{has ? `✅ ${t('hasFile')}` : t('noFile')}</span>
      {has && (
        <button
          className={`${btn} text-red-600`}
          onClick={async () => {
            await deleteBlob(k);
            await refresh();
            onChange?.();
          }}
        >
          {t('remove')}
        </button>
      )}
    </div>
  );
}

function AudioSection({ s, t, set }: SectionProps) {
  const player = useRef(createPlayer());
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(s.audio.volume);
  useEffect(() => setVolume(s.audio.volume), [s.audio.volume]);
  useEffect(() => () => player.current.stop(), []);

  const preview = async (sound: SoundId) => {
    if (playing) {
      player.current.stop();
      return setPlaying(false);
    }
    setPlaying(true);
    await player.current.play(sound, volume, () => setPlaying(false)).catch(() => setPlaying(false));
  };
  const commitVolume = () => set((x) => ({ ...x, audio: { ...x.audio, volume } }));

  return (
    <Section title={`🔊 ${t('sound')}`}>
      <Row label={t('muteAll')}>
        <Toggle checked={s.audio.muted} onChange={(v) => set((x) => ({ ...x, audio: { ...x.audio, muted: v } }))} />
      </Row>
      <Row label={t('sound')}>
        <div className="flex gap-2">
          <select
            className={control}
            value={s.audio.sound}
            onChange={(e) =>
              set((x) => ({ ...x, audio: { ...x.audio, sound: e.target.value as Settings['audio']['sound'] } }))
            }
          >
            <option value="chime">{t('chime')}</option>
            <option value="custom">{t('custom')}</option>
          </select>
          <button className={btn} onClick={() => preview(s.audio.sound)}>
            {playing ? `⏹ ${t('stop')}` : `▶️ ${t('preview')}`}
          </button>
        </div>
      </Row>
      <FileSlot k="azan" label={t('upload')} t={t} />
      <Row label={t('fajrSound')}>
        <select
          className={control}
          value={s.audio.fajrSound}
          onChange={(e) =>
            set((x) => ({ ...x, audio: { ...x.audio, fajrSound: e.target.value as Settings['audio']['fajrSound'] } }))
          }
        >
          <option value="same">{t('same')}</option>
          <option value="chime">{t('chime')}</option>
          <option value="custom">{t('custom')}</option>
          <option value="custom-fajr">{t('customFajr')}</option>
        </select>
      </Row>
      <FileSlot k="azan-fajr" label={t('uploadFajr')} t={t} />
      <Row label={`${t('volume')} (${Math.round(volume * 100)}%)`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          onPointerUp={commitVolume}
          onKeyUp={commitVolume}
          className="w-48 accent-emerald-600"
        />
      </Row>
    </Section>
  );
}

function DisplaySection({ s, t, set }: SectionProps) {
  const d = s.display;
  const setD = (patch: Partial<Settings['display']>) =>
    set((x) => ({ ...x, display: { ...x.display, ...patch } }));
  return (
    <Section title={`🎨 ${t('display')}`}>
      <Row label={t('language')}>
        <select className={control} value={d.language} onChange={(e) => setD({ language: e.target.value as 'en' | 'ar' })}>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </Row>
      <Row label={t('clock')}>
        <select className={control} value={d.clock} onChange={(e) => setD({ clock: e.target.value as '12h' | '24h' })}>
          <option value="12h">12h</option>
          <option value="24h">24h</option>
        </select>
      </Row>
      <Row label={t('theme')}>
        <select
          className={control}
          value={d.theme}
          onChange={(e) => setD({ theme: e.target.value as Settings['display']['theme'] })}
        >
          <option value="auto">{t('auto')}</option>
          <option value="light">{t('light')}</option>
          <option value="dark">{t('dark')}</option>
        </select>
      </Row>
      <Row label={t('units')}>
        <select className={control} value={d.units} onChange={(e) => setD({ units: e.target.value as 'c' | 'f' })}>
          <option value="c">°C</option>
          <option value="f">°F</option>
        </select>
      </Row>
      <Row label={t('hijriOffset')}>
        <select className={control} value={d.hijriOffset} onChange={(e) => setD({ hijriOffset: Number(e.target.value) })}>
          {[-2, -1, 0, 1, 2].map((n) => (
            <option key={n} value={n}>
              {n > 0 ? `+${n}` : n}
            </option>
          ))}
        </select>
      </Row>
      <Row label={t('showSeconds')}>
        <Toggle checked={d.showSeconds} onChange={(v) => setD({ showSeconds: v })} />
      </Row>
      <Row label={t('showSunrise')}>
        <Toggle checked={d.showSunrise} onChange={(v) => setD({ showSunrise: v })} />
      </Row>
      <Row label={t('showWeather')}>
        <Toggle checked={d.showWeather} onChange={(v) => setD({ showWeather: v })} />
      </Row>
      <Row label={t('showQibla')}>
        <Toggle checked={d.showQibla} onChange={(v) => setD({ showQibla: v })} />
      </Row>
      <Row label={t('showBadge')}>
        <Toggle checked={s.badge} onChange={(v) => set((x) => ({ ...x, badge: v }))} />
      </Row>
      <div>
        <div className="mb-2 text-sm">{t('background')}</div>
        <div className="flex flex-wrap gap-2">
          {[{ id: 'dynamic', css: 'conic-gradient(#2b3a67,#c06c84,#d9a96a,#137a8f,#2b3a67)' }, ...BACKGROUNDS].map(
            (b) => (
              <button
                key={b.id}
                title={t(`bg_${b.id}` as TKey)}
                onClick={() => setD({ background: b.id })}
                className={`h-14 w-20 rounded-lg text-xs font-medium text-white ring-offset-2 dark:ring-offset-slate-900 ${
                  d.background === b.id ? 'ring-2 ring-emerald-500' : ''
                }`}
                style={{ background: b.css }}
              >
                {b.id === 'dynamic' ? '✨ ' : ''}
                {t(`bg_${b.id}` as TKey)}
              </button>
            ),
          )}
          <button
            onClick={() => setD({ background: 'custom' })}
            className={`h-14 w-20 rounded-lg bg-slate-200 text-xs dark:bg-slate-700 ${
              d.background === 'custom' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''
            }`}
          >
            🖼️ {t('bg_custom')}
          </button>
        </div>
        <div className="mt-2">
          <FileSlot k="background" label={t('uploadBg')} t={t} onChange={() => setD({ background: 'custom' })} />
        </div>
      </div>
    </Section>
  );
}
