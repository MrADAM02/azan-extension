import { useEffect, useMemo, useState } from 'react';
import { getSettings, settingsItem, withDefaults, type Settings } from './settings';
import { makeT } from './i18n';
import { getBlob, type BlobKey } from './blobStore';

export function useSettings(): Settings | null {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => {
    getSettings().then(setS);
    return settingsItem.watch((v) => setS(withDefaults(v)));
  }, []);
  return s;
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useT(s: Settings | null) {
  const lang = s?.display.language ?? 'en';
  return useMemo(() => makeT(lang), [lang]);
}

/** Applies dark mode, language and text direction to <html>. */
export function useDocumentTheme(s: Settings | null) {
  useEffect(() => {
    if (!s) return;
    const root = document.documentElement;
    root.lang = s.display.language;
    root.dir = s.display.language === 'ar' ? 'rtl' : 'ltr';
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      root.classList.toggle(
        'dark',
        s.display.theme === 'dark' || (s.display.theme === 'auto' && mq.matches),
      );
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s?.display.language, s?.display.theme]);
}

/** Object URL for a stored blob; `version` forces a reload after upload. */
export function useBlobUrl(key: BlobKey, enabled: boolean, version = 0): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return setUrl(null);
    let u: string | null = null;
    let cancelled = false;
    getBlob(key).then((b) => {
      if (cancelled || !b) return setUrl(null);
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      cancelled = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [key, enabled, version]);
  return url;
}
