import { useEffect, useState } from 'react';
import { detectLocation, searchCities, type CityResult } from '@/lib/location';
import type { SavedLocation, Settings } from '@/lib/settings';
import type { T } from '@/lib/i18n';

interface Props {
  settings: Settings;
  t: T;
  onPick: (loc: SavedLocation) => void;
  dark?: boolean; // style for dark backgrounds (new tab onboarding)
}

export function LocationPicker({ settings, t, onPick, dark }: Props) {
  const lang = settings.display.language;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      searchCities(q, lang, ctrl.signal)
        .then((r) => {
          setResults(r);
          setSearched(true);
        })
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query, lang]);

  async function detect() {
    setDetecting(true);
    setError(null);
    try {
      onPick(await detectLocation(lang));
    } catch {
      setError(t('locationError'));
    } finally {
      setDetecting(false);
    }
  }

  const input = dark
    ? 'bg-white/15 text-white placeholder-white/60 ring-white/30 focus:ring-white'
    : 'bg-white text-slate-900 placeholder-slate-400 ring-slate-300 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600';
  const panel = dark
    ? 'bg-slate-900/80 text-white'
    : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="w-full max-w-md space-y-3">
      <button
        type="button"
        onClick={detect}
        disabled={detecting}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
      >
        📍 {detecting ? t('detecting') : t('detect')}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className={`text-center text-sm ${dark ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
        {t('orSearch')}
      </p>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchCity')}
          className={`w-full rounded-xl px-4 py-2.5 outline-none ring-1 focus:ring-2 ${input}`}
        />
        {searched && (
          <ul className={`absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl shadow-xl ${panel}`}>
            {results.length === 0 && <li className="px-4 py-2 text-sm opacity-70">{t('noResults')}</li>}
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    const { id: _id, region: _r, ...loc } = r;
                    onPick(loc);
                    setQuery('');
                  }}
                  className="w-full px-4 py-2 text-start hover:bg-emerald-500/20"
                >
                  <span className="font-medium">{r.city}</span>
                  <span className="text-sm opacity-70">
                    {' '}
                    {[r.region, r.country].filter(Boolean).join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
