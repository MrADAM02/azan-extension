/** Types and loaders for the bundled religious content built by scripts/build-content.mjs. */

export interface QuranData {
  surahs: Record<string, { ayahs: number; ar: string; en: string; meaning: string }>;
  items: { s: number; ayahs: { n: number; ar: string; en: string }[] }[];
}
export interface HadithData {
  collections: Record<string, { ar: string; en: string }>;
  items: { c: string; n: number; text: string }[];
}
export interface AdhkarData {
  items: { n: number; text: string; count: number; type: 0 | 1 | 2; source: string }[];
}

export type ContentKind = 'quran' | 'dhikr' | 'hadith';
export type DhikrPeriod = 'morning' | 'evening' | 'general';

const cache = new Map<string, Promise<unknown>>();
function load<T>(file: 'quran' | 'hadith' | 'adhkar'): Promise<T> {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(browser.runtime.getURL(`/content/${file}.json`)).then((r) => {
        if (!r.ok) throw new Error(`content ${file}: ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(file) as Promise<T>;
}

export const loadQuran = () => load<QuranData>('quran');
export const loadHadith = () => load<HadithData>('hadith');
export const loadAdhkar = () => load<AdhkarData>('adhkar');

/** Adhkar suitable for the time of day (type 0 = both, 1 = morning, 2 = evening). */
export function adhkarFor(data: AdhkarData, period: DhikrPeriod) {
  return data.items.filter((d) =>
    period === 'morning' ? d.type !== 2 : period === 'evening' ? d.type !== 1 : d.type === 0,
  );
}

export const pickRandom = <T,>(list: T[], avoid?: T): T => {
  if (list.length > 1 && avoid !== undefined) list = list.filter((x) => x !== avoid);
  return list[Math.floor(Math.random() * list.length)]!;
};
