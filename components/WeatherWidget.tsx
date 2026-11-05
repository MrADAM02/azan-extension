import { useEffect, useState } from 'react';
import { describeWeather, getWeather, type Weather } from '@/lib/weather';
import { fmtNumber } from '@/lib/format';
import type { Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';

export function WeatherWidget({ settings, t }: { settings: Settings; t: T }) {
  const loc = settings.location!;
  const units = settings.display.units;
  const [w, setW] = useState<Weather | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getWeather(loc, units)
        .then((d) => alive && setW(d))
        .catch(() => {}); // offline or API down: just hide the widget
    load();
    const id = setInterval(load, 30 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [loc.lat, loc.lng, units]);

  if (!w) return null;
  const { icon, label } = describeWeather(w, settings.display.language);
  const deg = (n: number) => `${fmtNumber(n, settings)}°`;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-md">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-xl font-semibold">
          {deg(w.temp)}
          {units.toUpperCase()}
        </div>
        <div className="text-xs opacity-80">
          {label} · {deg(w.max)} / {deg(w.min)}
        </div>
        <div className="text-xs opacity-60">
          {t('feelsLike')} {deg(w.feelsLike)}
        </div>
      </div>
    </div>
  );
}
